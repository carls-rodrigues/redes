#!/usr/bin/env node
const net = require('net');

const socket = net.createConnection({ host: 'localhost', port: 5000 }, () => {
  console.log('✓ Connected to socket server\n');

  setTimeout(() => {
    const loginMsg = JSON.stringify({
      type: 'login',
      username: 'alice',
      password: 'password123'
    });
    console.log('→ Sending login...');
    socket.write(loginMsg + '\n');
  }, 500);
});

let isLoggedIn = false;

socket.on('data', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('← Received:', JSON.stringify(msg, null, 2));

    if ((msg.status === 'ok' || msg.status === 'registered') && msg.user_id && !isLoggedIn) {
      isLoggedIn = true;
      console.log('\n✓ Logged in as:', msg.username);

      setTimeout(() => {
        const searchMsg = JSON.stringify({
          type: 'search_users',
          request_id: 'test-search-1',
          query: 'b'
        });
        console.log('\n→ Sending search for "b"...');
        socket.write(searchMsg + '\n');
      }, 500);
    }

    if (msg.request_id === 'test-search-1') {
      console.log('\n✓ Search complete!\n');
      setTimeout(() => socket.end(), 500);
    }
  } catch (e) {
    console.error('Parse error:', e.message);
  }
});

socket.on('error', (err) => {
  console.error('❌ Socket error:', err.message);
});

socket.on('end', () => {
  console.log('✓ Socket disconnected');
  process.exit(0);
});
