#!/usr/bin/env node
const net = require('net');

// Test socket connection and search
const socket = net.createConnection({ host: 'localhost', port: 5000 }, () => {
  console.log('✓ Connected to socket server');

  // Wait a moment then send search request
  setTimeout(() => {
    // First, simulate login to get session
    const loginMsg = JSON.stringify({
      type: 'login',
      username: 'user1',
      password: 'password123'
    });
    socket.write(loginMsg + '\n');
  }, 500);
});

socket.on('data', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('Received:', JSON.stringify(msg, null, 2));

    // If login successful, test search
    if (msg.status === 'ok' && msg.user_id) {
      setTimeout(() => {
        const searchMsg = JSON.stringify({
          type: 'search_users',
          request_id: 'test-1',
          query: 'user'
        });
        console.log('\nSending search request...');
        socket.write(searchMsg + '\n');
      }, 500);
    }

    // If search returned, close
    if (msg.type === 'search_users' || (msg.request_id === 'test-1')) {
      console.log('\n✓ Test complete!');
      setTimeout(() => socket.end(), 1000);
    }
  } catch (e) {
    console.error('Parse error:', e.message);
  }
});

socket.on('error', (err) => {
  console.error('❌ Socket error:', err.message);
});

socket.on('end', () => {
  console.log('\n✓ Socket disconnected');
});

socket.on('close', () => {
  process.exit(0);
});
