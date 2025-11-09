import * as net from 'net';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { SocketHandler } from './handlers/SocketHandler';
import { SocketMessage } from './types';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const HOST = process.env.HOST || '0.0.0.0';
const handler = new SocketHandler();

// Create hybrid server that detects protocol
const server = net.createServer((socket) => {
  const clientId = uuidv4();
  let buffer = Buffer.alloc(0);
  let protocolDetected = false;

  const detectProtocol = (data: Buffer) => {
    buffer = Buffer.concat([buffer, data]);
    
    // Need at least 16 bytes to reliably detect HTTP
    if (buffer.length < 16) return;
    
    protocolDetected = true;
    socket.removeListener('data', detectProtocol);
    
    const dataStr = buffer.toString('utf8', 0, Math.min(buffer.length, 100));
    
    // Check if it's an HTTP request (WebSocket upgrade)
    if (dataStr.startsWith('GET ')) {
      console.log(`[${new Date().toISOString()}] 🔌 WebSocket upgrade initiated by client ${clientId}`);
      handleWebSocketUpgrade(socket, buffer, clientId);
    } else {
      // It's a raw TCP connection
      console.log(`[${new Date().toISOString()}] 🔌 TCP client connected: ${clientId}`);
      handleRawTcpConnection(socket, buffer, clientId);
    }
  };

  socket.on('data', detectProtocol);

  socket.on('error', (error: any) => {
    if (error.code !== 'EPIPE' && error.code !== 'ECONNRESET') {
      console.error(`Socket error for ${clientId}:`, error);
    }
    if (!protocolDetected) {
      socket.removeListener('data', detectProtocol);
    }
  });
});

function handleWebSocketUpgrade(socket: any, initialData: Buffer, clientId: string) {
  // Parse HTTP headers
  const dataStr = initialData.toString('utf8');
  const headerEnd = dataStr.indexOf('\r\n\r\n');
  
  if (headerEnd === -1) {
    socket.destroy();
    return;
  }
  
  const headerLines = dataStr.substring(0, headerEnd).split('\r\n');
  const headers: Record<string, string> = {};
  
  for (let i = 1; i < headerLines.length; i++) {
    const line = headerLines[i];
    const colonIndex = line.indexOf(': ');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).toLowerCase();
      const value = line.substring(colonIndex + 2);
      headers[key] = value;
    }
  }
  
  // Verify WebSocket upgrade
  if (headers['upgrade']?.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }
  
  const key = headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  
  // Generate accept token according to RFC 6455
  const acceptToken = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  
  // Send upgrade response
  const response = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptToken}`,
    '',
    ''
  ].join('\r\n');
  
  socket.write(response);
  
  // Register as WebSocket client
  handler.registerWebSocketClient(clientId, socket);
  console.log(`[${new Date().toISOString()}] ✅ WebSocket handshake completed for client ${clientId}`);
  
  // Handle WebSocket frames
  let frameBuffer = Buffer.alloc(0);
  
  socket.on('data', async (chunk: Buffer) => {
    frameBuffer = Buffer.concat([frameBuffer, chunk]);
    
    while (frameBuffer.length >= 2) {
      const byte1 = frameBuffer[0];
      const byte2 = frameBuffer[1];
      
      const fin = (byte1 & 0x80) >> 7;
      const rsv = (byte1 & 0x70) >> 4;
      const opcode = byte1 & 0x0f;
      const masked = (byte2 & 0x80) >> 7;
      let payloadLen = byte2 & 0x7f;
      
      // Validate frame
      if (!fin || rsv !== 0) {
        console.error(`Invalid frame header from ${clientId}`);
        socket.end();
        break;
      }
      
      if (!masked) {
        console.error(`Unmasked frame from client ${clientId}`);
        socket.end();
        break;
      }
      
      // Determine payload length
      let headerLen = 2;
      if (payloadLen === 126) {
        if (frameBuffer.length < 4) break;
        payloadLen = frameBuffer.readUInt16BE(2);
        headerLen = 4;
      } else if (payloadLen === 127) {
        if (frameBuffer.length < 10) break;
        payloadLen = Number(frameBuffer.readBigUInt64BE(2));
        headerLen = 10;
      }
      
      const frameEnd = headerLen + 4 + payloadLen;
      if (frameBuffer.length < frameEnd) break;
      
      // Extract masking key and payload
      const maskingKey = frameBuffer.slice(headerLen, headerLen + 4);
      const payload = Buffer.alloc(payloadLen);
      frameBuffer.copy(payload, 0, headerLen + 4, frameEnd);
      
      // Unmask payload
      for (let i = 0; i < payloadLen; i++) {
        payload[i] ^= maskingKey[i % 4];
      }
      
      // Process frame based on opcode
      if (opcode === 0x1) {
        // Text frame
        try {
          const message: SocketMessage = JSON.parse(payload.toString('utf-8'));
          console.log(`[${new Date().toISOString()}] 📨 Message received from ${clientId}: ${message.type}`);
          await handler.handleMessage(clientId, message);
          console.log(`[${new Date().toISOString()}] ✅ Message processed: ${message.type} (ID: ${message.request_id || 'N/A'})`);
        } catch (err) {
          console.error(`[${new Date().toISOString()}] ❌ Error parsing message from ${clientId}:`, err);
          sendWebSocketMessage(socket, { type: 'error', message: 'Invalid JSON' });
        }
      } else if (opcode === 0x8) {
        // Close frame
        handler.unregisterClient(clientId);
        socket.end();
        break;
      } else if (opcode === 0x9) {
        // Ping frame - respond with pong
        console.log(`[${new Date().toISOString()}] 💓 Ping received from ${clientId}`);
        const pongFrame = Buffer.from([0x8a, 0x00]);
        if (socket.writable && !socket.destroyed) {
          socket.write(pongFrame);
          console.log(`[${new Date().toISOString()}] 💓 Pong sent to ${clientId}`);
        }
      } else if (opcode === 0xa) {
        // Pong frame - ignore
        console.log(`[${new Date().toISOString()}] 💓 Pong received from ${clientId}`);
      }
      
      frameBuffer = frameBuffer.slice(frameEnd);
    }
  });
  
  socket.on('end', () => {
    handler.unregisterClient(clientId);
    console.log(`[${new Date().toISOString()}] 🔌 WebSocket client disconnected: ${clientId}`);
  });
  
  socket.on('error', (err: any) => {
    if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
      console.error(`WebSocket error for ${clientId}:`, err);
    }
    handler.unregisterClient(clientId);
  });
}

function handleRawTcpConnection(socket: any, initialData: Buffer, clientId: string) {
  handler.registerClient(clientId, socket);
  
  let buffer = initialData.toString();
  
  // Process initial data
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (!line.trim()) continue;
    processLine(socket, clientId, line);
  }
  
  socket.on('data', async (data: Buffer) => {
    buffer += data.toString();
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.trim()) continue;
      await processLine(socket, clientId, line);
    }
  });
  
  socket.on('end', () => {
    handler.unregisterClient(clientId);
    console.log(`[${new Date().toISOString()}] 🔌 TCP client disconnected: ${clientId}`);
  });
  
  socket.on('error', (error: any) => {
    if (error.code !== 'EPIPE' && error.code !== 'ECONNRESET') {
      console.error(`TCP error for ${clientId}:`, error);
    }
    handler.unregisterClient(clientId);
  });
}

async function processLine(socket: any, clientId: string, line: string) {
  try {
    const message: SocketMessage = JSON.parse(line);
    await handler.handleMessage(clientId, message);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      if (socket.writable && !socket.destroyed) {
        socket.write(JSON.stringify({ 
          status: 'error', 
          message: 'Invalid JSON format' 
        }) + '\n');
      }
    } else {
      console.error(`Error processing message from ${clientId}:`, error);
    }
  }
}

function sendWebSocketMessage(socket: any, data: any) {
  if (!socket.writable || socket.destroyed) {
    console.warn('Attempted to write to closed WebSocket');
    return;
  }
  
  const payload = Buffer.from(JSON.stringify(data), 'utf8');
  const payloadLen = payload.length;

  let header: Buffer;

  if (payloadLen < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text opcode
    header[1] = payloadLen;
  } else if (payloadLen < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLen, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payloadLen), 2);
  }

  try {
    socket.write(Buffer.concat([header, payload]));
  } catch (error) {
    console.error('Error writing to WebSocket:', error);
  }
}

// Register the send function with the handler
handler.setSendWebSocketMessage(sendWebSocketMessage);

server.listen(PORT, HOST, () => {
  console.log(`🚀 Chat server started on ${HOST}:${PORT}`);
  console.log(`   📡 WebSocket endpoint: ws://${HOST}:${PORT}/ws`);
  console.log(`   🔌 Raw TCP endpoint: ${HOST}:${PORT}`);
  console.log(`   📊 Ready to handle real-time chat connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});