import * as net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { SocketHandler } from './handlers/SocketHandler';
import { SocketMessage } from './types';

const PORT = 5000;
const handler = new SocketHandler();

const server = net.createServer((socket) => {
  const clientId = uuidv4();
  handler.registerClient(clientId, socket);
  
  console.log(`[${new Date().toISOString()}] Client connected: ${clientId}`);
  
  let buffer = '';

  socket.on('data', async (data) => {
    buffer += data.toString();
    
    // Process complete lines (separated by \n)
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const message: SocketMessage = JSON.parse(line);
        await handler.handleMessage(clientId, message);
      } catch (error: any) {
        if (error instanceof SyntaxError) {
          socket.write(JSON.stringify({ 
            status: 'error', 
            message: 'Invalid JSON format' 
          }) + '\n');
        } else {
          console.error(`Error processing message from ${clientId}:`, error);
        }
      }
    }
  });

  socket.on('end', () => {
    handler.unregisterClient(clientId);
    console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error for ${clientId}:`, error);
    handler.unregisterClient(clientId);
  });
});

server.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
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
