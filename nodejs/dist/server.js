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
const uuid_1 = require("uuid");
const SocketHandler_1 = require("./handlers/SocketHandler");
const PORT = 5000;
const handler = new SocketHandler_1.SocketHandler();
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
//# sourceMappingURL=server.js.map