"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketHandler = void 0;
const services_1 = require("../services");
class SocketHandler {
    constructor() {
        this.clients = new Map();
        this.userSessions = new Map(); // userId -> clientId
    }
    registerClient(clientId, socket) {
        this.clients.set(clientId, { socket });
    }
    unregisterClient(clientId) {
        const client = this.clients.get(clientId);
        if (client?.userId) {
            this.userSessions.delete(client.userId);
        }
        this.clients.delete(clientId);
    }
    async handleMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        try {
            switch (message.type) {
                case 'login':
                    await this.handleLogin(clientId, message);
                    break;
                case 'register':
                    await this.handleRegister(clientId, message);
                    break;
                case 'get_user_chats':
                    await this.handleGetUserChats(clientId, message);
                    break;
                case 'get_messages':
                    await this.handleGetMessages(clientId, message);
                    break;
                case 'message':
                    await this.handleSendMessage(clientId, message);
                    break;
            }
        }
        catch (error) {
            this.sendError(clientId, 'Internal server error');
            console.error('Error handling message:', error);
        }
    }
    async handleLogin(clientId, message) {
        const { username, password } = message;
        if (!username || !password) {
            return this.sendError(clientId, 'Username and password required');
        }
        const user = await services_1.userService.getUserByUsername(username);
        if (!user) {
            return this.sendError(clientId, 'Invalid credentials');
        }
        const isValid = await services_1.userService.verifyPassword(password, user.password);
        if (!isValid) {
            return this.sendError(clientId, 'Invalid credentials');
        }
        const session = await services_1.userService.createSession(user.id, username);
        const client = this.clients.get(clientId);
        if (client) {
            client.userId = user.id;
            client.session = session;
            this.userSessions.set(user.id, clientId);
            this.sendMessage(clientId, {
                status: 'ok',
                user_id: user.id,
                username: user.username,
                session_id: session.session_id
            });
        }
    }
    async handleRegister(clientId, message) {
        const { username, password } = message;
        if (!username || !password) {
            return this.sendError(clientId, 'Username and password required');
        }
        try {
            const user = await services_1.userService.createUser(username, password);
            const session = await services_1.userService.createSession(user.id, username);
            const client = this.clients.get(clientId);
            if (client) {
                client.userId = user.id;
                client.session = session;
                this.userSessions.set(user.id, clientId);
                this.sendMessage(clientId, {
                    status: 'registered',
                    user_id: user.id,
                    username: user.username,
                    session_id: session.session_id
                });
            }
        }
        catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                return this.sendError(clientId, 'Username already exists');
            }
            throw error;
        }
    }
    async handleGetUserChats(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated');
        }
        const chats = await services_1.chatService.getUserChats(client.session.user_id);
        this.sendMessage(clientId, {
            status: 'ok',
            chats
        });
    }
    async handleGetMessages(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated');
        }
        const { chat_id } = message;
        if (!chat_id) {
            return this.sendError(clientId, 'chat_id required');
        }
        const messages = await services_1.messageService.getMessages(chat_id);
        this.sendMessage(clientId, {
            status: 'ok',
            messages
        });
    }
    async handleSendMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated');
        }
        const { chat_id, content } = message;
        if (!chat_id || !content) {
            return this.sendError(clientId, 'chat_id and content required');
        }
        const msg = await services_1.messageService.sendMessage(chat_id, client.session.user_id, content);
        // Send confirmation to sender
        this.sendMessage(clientId, {
            status: 'ok',
            message_id: msg.id,
            timestamp: msg.timestamp
        });
        // Broadcast to other participants
        const participants = await services_1.chatService.getChatParticipants(chat_id);
        for (const participant of participants) {
            if (participant.id !== client.session.user_id) {
                const receiverClientId = this.userSessions.get(participant.id);
                if (receiverClientId) {
                    this.sendMessage(receiverClientId, {
                        chat_id,
                        message: {
                            id: msg.id,
                            sender_id: msg.sender_id,
                            sender_username: client.session.username,
                            content: msg.content,
                            timestamp: msg.timestamp
                        }
                    });
                }
            }
        }
    }
    sendMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (client) {
            const json = JSON.stringify(data);
            client.socket.write(json);
        }
    }
    sendError(clientId, error) {
        this.sendMessage(clientId, { status: 'error', message: error });
    }
    getConnectedUsers() {
        return new Set(this.userSessions.keys());
    }
    isUserOnline(userId) {
        return this.userSessions.has(userId);
    }
}
exports.SocketHandler = SocketHandler;
//# sourceMappingURL=SocketHandler.js.map