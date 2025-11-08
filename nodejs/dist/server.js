"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const crypto = __importStar(require("crypto"));
const uuid_1 = require("uuid");
const SocketHandler_1 = require("./handlers/SocketHandler");
const services_1 = require("./services");
const PORT = 5000;
const HTTP_PORT = 8080;
const handler = new SocketHandler_1.SocketHandler();
const userService = new services_1.UserService();
const chatService = new services_1.ChatService();
const messageService = new services_1.MessageService();
// Will be set after defining sendWebSocketMessage function
let sendWebSocketMessageFn;
const server = net.createServer((socket) => {
    const clientId = (0, uuid_1.v4)();
    handler.registerClient(clientId, socket);
    console.log(`[${new Date().toISOString()}] Client connected: ${clientId}`);
    let buffer = '';
    socket.on('data', async (data) => {
        buffer += data.toString();
        // Process complete lines (separated by \n)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const message = JSON.parse(line);
                await handler.handleMessage(clientId, message);
            }
            catch (error) {
                if (error instanceof SyntaxError) {
                    socket.write(JSON.stringify({
                        status: 'error',
                        message: 'Invalid JSON format'
                    }) + '\n');
                }
                else {
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
// HTTP Server for Static Files ONLY
// NO REST API endpoints - all communication via WebSocket
const httpServer = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '/';
    // Serve static files
    if (pathname === '/' || pathname === '/index.html') {
        serveFile(res, 'index.html', 'text/html');
    }
    else if (pathname === '/chat.html') {
        serveFile(res, 'chat.html', 'text/html');
    }
    else if (pathname === '/style.css') {
        serveFile(res, 'style.css', 'text/css');
    }
    else if (pathname === '/app.js') {
        serveFile(res, 'app.js', 'application/javascript');
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});
// Handle WebSocket upgrades  
httpServer.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url || '').pathname || '/';
    if (pathname === '/ws') {
        handleWebSocketUpgrade(req, socket, head);
    }
    else {
        socket.destroy();
    }
});
httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP server (static files only) listening on port ${HTTP_PORT}`);
    console.log(`Open http://localhost:${HTTP_PORT} in your browser`);
});
function serveFile(res, filename, contentType) {
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
function handleWebSocketUpgrade(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
        console.error('No WebSocket key provided');
        socket.destroy();
        return;
    }
    // Generate accept token according to RFC 6455
    const acceptToken = crypto
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');
    // Build HTTP upgrade response with proper CRLF line endings
    const response = `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acceptToken}\r\n\r\n`;
    console.log(`[WebSocket] Sending upgrade response:`, response.replace(/\r\n/g, '\\r\\n'));
    socket.write(response);
    const clientId = (0, uuid_1.v4)();
    handler.registerWebSocketClient(clientId, socket);
    console.log(`[${new Date().toISOString()}] WebSocket client connected: ${clientId}`);
    let buffer = Buffer.alloc(0);
    socket.on('data', async (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= 2) {
            // Read first byte
            const byte1 = buffer[0];
            const byte2 = buffer[1];
            // Extract fields from first byte
            const fin = (byte1 & 0x80) >> 7;
            const rsv = (byte1 & 0x70) >> 4;
            const opcode = byte1 & 0x0f;
            // Extract mask and payload length from second byte
            const masked = (byte2 & 0x80) >> 7;
            let payloadLen = byte2 & 0x7f;
            // Validate frame
            if (!fin || rsv !== 0) {
                console.error(`Invalid frame header from ${clientId}: FIN=${fin}, RSV=${rsv}`);
                socket.end();
                break;
            }
            if (!masked) {
                console.error(`Unmasked frame from client ${clientId}`);
                socket.end();
                break;
            }
            // Determine header length and payload length
            let headerLen = 2;
            if (payloadLen === 126) {
                if (buffer.length < 4)
                    break;
                payloadLen = buffer.readUInt16BE(2);
                headerLen = 4;
            }
            else if (payloadLen === 127) {
                if (buffer.length < 10)
                    break;
                // Read 64-bit big-endian length
                payloadLen = Number(buffer.readBigUInt64BE(2));
                headerLen = 10;
            }
            // Calculate frame size
            const maskingKeyStart = headerLen;
            const maskingKeyEnd = maskingKeyStart + 4;
            const payloadStart = maskingKeyEnd;
            const frameEnd = payloadStart + payloadLen;
            // Check if we have the complete frame
            if (buffer.length < frameEnd)
                break;
            // Extract masking key and payload
            const maskingKey = buffer.slice(maskingKeyStart, maskingKeyEnd);
            const payload = Buffer.alloc(payloadLen);
            buffer.copy(payload, 0, payloadStart, frameEnd);
            // Unmask payload
            for (let i = 0; i < payloadLen; i++) {
                payload[i] ^= maskingKey[i % 4];
            }
            // Process frame based on opcode
            if (opcode === 0x1) {
                // Text frame
                try {
                    const message = JSON.parse(payload.toString('utf-8'));
                    await handler.handleMessage(clientId, message);
                }
                catch (err) {
                    console.error(`Error parsing message from ${clientId}:`, err);
                    sendWebSocketMessage(socket, { type: 'error', message: 'Invalid JSON' });
                }
            }
            else if (opcode === 0x8) {
                // Close frame
                handler.unregisterClient(clientId);
                socket.end();
                break;
            }
            else if (opcode === 0x9) {
                // Ping frame - respond with pong
                const pongFrame = Buffer.alloc(2);
                pongFrame[0] = 0x8a; // FIN + Pong opcode
                pongFrame[1] = 0x00; // No payload
                socket.write(pongFrame);
            }
            else if (opcode === 0xa) {
                // Pong frame - ignore
            }
            // Remove processed frame from buffer
            buffer = buffer.slice(frameEnd);
        }
    });
    socket.on('end', () => {
        handler.unregisterClient(clientId);
        console.log(`[${new Date().toISOString()}] WebSocket client disconnected: ${clientId}`);
    });
    socket.on('error', (err) => {
        console.error(`WebSocket error for ${clientId}:`, err);
        handler.unregisterClient(clientId);
    });
}
function sendWebSocketMessage(socket, data) {
    const payload = Buffer.from(JSON.stringify(data), 'utf8');
    const payloadLen = payload.length;
    let header;
    if (payloadLen < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81; // FIN + text opcode
        header[1] = payloadLen;
    }
    else if (payloadLen < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(payloadLen, 2);
    }
    else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(payloadLen), 2);
    }
    socket.write(Buffer.concat([header, payload]));
}
// Register the send function with the handler
handler.setSendWebSocketMessage(sendWebSocketMessage);
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
//# sourceMappingURL=server.js.map