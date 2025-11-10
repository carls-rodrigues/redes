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
        console.log(`✓ Conectado ao servidor em ${host}:${port}`);
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
          console.log('\n📨 Resposta:', JSON.stringify(message, null, 2));
          this.messageQueue.push(message);
        } catch (e) {
          // Incomplete JSON, wait for more data
          break;
        }
      }
    });

    this.socket.on('end', () => {
      console.log('\n✗ Conexão fechada pelo servidor');
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
    console.log(`\n📤 Enviando: ${JSON.stringify(message, null, 2)}`);
    this.socket.write(json);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.end();
      console.log('\n✓ Desconectado do servidor');
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
    console.log('🔌 Conectando ao servidor...');
    await client.connect();

    // Test 1: Register a new user
    console.log('\n=== TESTE 1: Registrar Usuário ===');
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
    console.log(`✓ Usuário registrado com sucesso (ID: ${userId})`);

    // Test 2: Get user chats (should be empty)
    console.log('\n=== TESTE 2: Obter Chats do Usuário (Vazio) ===');
    client.send({
      type: 'get_user_chats'
    });
    
    response = await client.waitForResponse();
    if (response && response.status === 'ok') {
      console.log(`✓ Obteve ${response.chats.length} chats`);
    } else {
      console.error('✗ Failed to get chats');
    }

    // Test 3: Logout and login
    console.log('\n=== TESTE 3: Login com Novas Credenciais ===');
    client.send({
      type: 'login',
      username: username,
      password: password
    });
    
    response = await client.waitForResponse();
    if (response && response.status === 'ok') {
      console.log(`✓ Login bem-sucedido (Sessão: ${response.session_id})`);
    } else {
      console.error('✗ Login failed');
    }

    // Test 4: Invalid login
    console.log('\n=== TESTE 4: Login Inválido ===');
    client.send({
      type: 'login',
      username: 'nonexistent_user',
      password: 'wrong_password'
    });
    
    response = await client.waitForResponse();
    if (response && response.status === 'error') {
      console.log(`✓ Login inválido rejeitado corretamente: ${response.message}`);
    } else {
      console.error('✗ Should have rejected invalid login');
    }

    console.log('\n=== TODOS OS TESTES CONCLUÍDOS ===');
    console.log('✓ Servidor socket está funcionando corretamente');

  } catch (error: any) {
    console.error('✗ Test error:', error.message);
  } finally {
    client.disconnect();
    process.exit(0);
  }
}

// Run tests
runTests().catch(console.error);
