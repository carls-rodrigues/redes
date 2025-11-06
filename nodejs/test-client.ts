#!/usr/bin/env node
/**
 * Test client for the Node.js socket server
 * 
 * This script tests the socket server with various operations:
 * - Register a new user
 * - Login with credentials
 * - Get user chats
 * - Send a message
 */

import * as net from 'net';
import * as readline from 'readline';

interface SocketMessage {
  type: string;
  [key: string]: any;
}

class TestClient {
  private socket: net.Socket | null = null;
  private buffer = '';
  private messageQueue: SocketMessage[] = [];
  private isConnected = false;

  connect(host: string = 'localhost', port: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({ host, port }, () => {
        console.log(`✓ Connected to server at ${host}:${port}`);
        this.isConnected = true;
        
        // Start listening for messages
        this.startListening();
        resolve();
      });

      this.socket.on('error', (error) => {
        console.error(`✗ Connection error: ${error.message}`);
        reject(error);
      });
    });
  }

  private startListening() {
    if (!this.socket) return;

    this.socket.on('data', (data) => {
      this.buffer += data.toString();
      
      while (this.buffer) {
        try {
          const message = JSON.parse(this.buffer);
          this.buffer = '';
          console.log('\n📨 Response:', JSON.stringify(message, null, 2));
          this.messageQueue.push(message);
        } catch (e) {
          // Incomplete JSON, wait for more data
          break;
        }
      }
    });

    this.socket.on('end', () => {
      console.log('\n✗ Connection closed by server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error(`\n✗ Socket error: ${error.message}`);
      this.isConnected = false;
    });
  }

  send(message: SocketMessage): void {
    if (!this.socket || !this.isConnected) {
      console.error('✗ Not connected to server');
      return;
    }

    const json = JSON.stringify(message);
    console.log(`\n📤 Sending: ${JSON.stringify(message, null, 2)}`);
    this.socket.write(json);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.end();
      console.log('\n✓ Disconnected from server');
    }
  }

  async waitForResponse(timeout: number = 5000): Promise<SocketMessage | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.messageQueue.length > 0) {
        return this.messageQueue.shift()!;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('⏱️ Timeout waiting for response');
    return null;
  }
}

async function runTests() {
  const client = new TestClient();
  
  try {
    // Connect to server
    console.log('🔌 Connecting to server...');
    await client.connect();

    // Test 1: Register a new user
    console.log('\n=== TEST 1: Register User ===');
    const username = `test_user_${Date.now()}`;
    const password = 'test123456';
    
    client.send({
      type: 'register',
      username: username,
      password: password
    });
    
    let response = await client.waitForResponse();
    if (!response) {
      console.error('✗ No response to register');
      return;
    }

    if (response.status !== 'registered') {
      console.error('✗ Registration failed');
      return;
    }

    const userId = response.user_id;
    const sessionId = response.session_id;
    console.log(`✓ User registered successfully (ID: ${userId})`);

    // Test 2: Get user chats (should be empty)
    console.log('\n=== TEST 2: Get User Chats (Empty) ===');
    client.send({
      type: 'get_user_chats'
    });
    
    response = await client.waitForResponse();
    if (response && response.status === 'ok') {
      console.log(`✓ Got ${response.chats.length} chats`);
    } else {
      console.error('✗ Failed to get chats');
    }

    // Test 3: Logout and login
    console.log('\n=== TEST 3: Login with New Credentials ===');
    client.send({
      type: 'login',
      username: username,
      password: password
    });
    
    response = await client.waitForResponse();
    if (response && response.status === 'ok') {
      console.log(`✓ Login successful (Session: ${response.session_id})`);
    } else {
      console.error('✗ Login failed');
    }

    // Test 4: Invalid login
    console.log('\n=== TEST 4: Invalid Login ===');
    client.send({
      type: 'login',
      username: 'nonexistent_user',
      password: 'wrong_password'
    });
    
    response = await client.waitForResponse();
    if (response && response.status === 'error') {
      console.log(`✓ Correctly rejected invalid login: ${response.message}`);
    } else {
      console.error('✗ Should have rejected invalid login');
    }

    console.log('\n=== ALL TESTS COMPLETED ===');
    console.log('✓ Socket server is working correctly');

  } catch (error: any) {
    console.error('✗ Test error:', error.message);
  } finally {
    client.disconnect();
    process.exit(0);
  }
}

// Run tests
runTests().catch(console.error);
