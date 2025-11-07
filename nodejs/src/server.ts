import * as net from 'net';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { v4 as uuidv4 } from 'uuid';
import { SocketHandler } from './handlers/SocketHandler';
import { SocketMessage } from './types';
import { UserService, ChatService, MessageService } from './services';

const PORT = 5000;
const HTTP_PORT = 8080;
const handler = new SocketHandler();
const userService = new UserService();
const chatService = new ChatService();
const messageService = new MessageService();

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

  socket.on('error', (error: any) => {
    // EPIPE is a normal error when client disconnects abruptly, don't log it
    if (error.code !== 'EPIPE') {
      console.error(`Socket error for ${clientId}:`, error);
    }
    handler.unregisterClient(clientId);
  });
});

server.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});

// HTTP Server for Web Interface
const httpServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '/';

  // Serve static files
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, 'index.html', 'text/html');
  } else if (pathname === '/chat.html') {
    serveFile(res, 'chat.html', 'text/html');
  } else if (pathname === '/style.css') {
    serveFile(res, 'style.css', 'text/css');
  } else if (pathname === '/app.js') {
    serveFile(res, 'app.js', 'application/javascript');
  } else if (pathname.startsWith('/api/')) {
    handleAPIRequest(req, res, parsedUrl);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

function serveFile(res: http.ServerResponse, filename: string, contentType: string) {
  const filePath = path.join(__dirname, '../public', filename);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handleAPIRequest(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery) {
  // Simple REST API for web clients
  const pathname = parsedUrl.pathname || '';
  const method = req.method || 'GET';

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'running' }));
  } else if (pathname === '/api/login' && method === 'POST') {
    handleLogin(req, res);
  } else if (pathname === '/api/register' && method === 'POST') {
    handleRegister(req, res);
  } else if (pathname === '/api/chats' && method === 'GET') {
    handleGetChats(req, res, parsedUrl);
  } else if (pathname === '/api/messages' && method === 'GET') {
    handleGetMessages(req, res, parsedUrl);
  } else if (pathname === '/api/messages' && method === 'POST') {
    handleSendMessage(req, res);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

httpServer.listen(HTTP_PORT, () => {
  console.log(`Web server listening on port ${HTTP_PORT}`);
  console.log(`Open http://localhost:${HTTP_PORT} in your browser`);
});

// HTTP API Handlers
async function handleLogin(req: http.IncomingMessage, res: http.ServerResponse) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { username, password } = JSON.parse(body);

      const user = await userService.getUserByUsername(username);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'User not found' }));
        return;
      }

      const isValidPassword = await userService.verifyPassword(password, user.password!);
      if (!isValidPassword) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid password' }));
        return;
      }

      const session = await userService.createSession(user.id, user.username);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, user, session }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
    }
  });
}

async function handleRegister(req: http.IncomingMessage, res: http.ServerResponse) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { username, password } = JSON.parse(body);

      const existingUser = await userService.getUserByUsername(username);
      if (existingUser) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Username already exists' }));
        return;
      }

      const user = await userService.createUser(username, password);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, user }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
    }
  });
}

async function handleGetChats(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery) {
  try {
    // For simplicity, we'll get chats for a hardcoded user
    // In a real app, you'd get user ID from authentication/session
    const userId = 'some-user-id'; // This should come from auth
    const chats = await chatService.getUserChats(userId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, chats }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Failed to get chats' }));
  }
}

async function handleGetMessages(req: http.IncomingMessage, res: http.ServerResponse, parsedUrl: url.UrlWithParsedQuery) {
  try {
    const chatId = parsedUrl.query.chatId as string;
    if (!chatId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'chatId required' }));
      return;
    }

    const messages = await messageService.getMessages(chatId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, messages }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Failed to get messages' }));
  }
}

async function handleSendMessage(req: http.IncomingMessage, res: http.ServerResponse) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { chatId, content, senderId } = JSON.parse(body);
      const result = await messageService.sendMessage(chatId, senderId, content);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: result }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
    }
  });
}

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
