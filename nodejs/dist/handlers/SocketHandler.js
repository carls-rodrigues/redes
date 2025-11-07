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
                case 'auth':
                    await this.handleAuth(clientId, message);
                    break;
                case 'login':
                    await this.handleLogin(clientId, message);
                    break;
                case 'register':
                    await this.handleRegister(clientId, message);
                    break;
                case 'get_user_chats':
                    await this.handleGetUserChats(clientId, message);
                    break;
                case 'get_chat':
                    await this.handleGetChat(clientId, message);
                    break;
                case 'get_messages':
                    await this.handleGetMessages(clientId, message);
                    break;
                case 'message':
                    await this.handleSendMessage(clientId, message);
                    break;
                case 'search_users':
                    await this.handleSearchUsers(clientId, message);
                    break;
                case 'create_dm':
                    await this.handleCreateDM(clientId, message);
                    break;
                case 'create_group':
                    await this.handleCreateGroup(clientId, message);
                    break;
                case 'list_groups':
                    await this.handleListGroups(clientId, message);
                    break;
                case 'add_group_member':
                    await this.handleAddGroupMember(clientId, message);
                    break;
                case 'remove_group_member':
                    await this.handleRemoveGroupMember(clientId, message);
                    break;
            }
        }
        catch (error) {
            this.sendError(clientId, 'Internal server error', message.request_id);
            console.error('Error handling message:', error);
        }
    }
    async handleAuth(clientId, message) {
        try {
            const { userId } = message;
            if (!userId) {
                return this.sendError(clientId, 'userId required', message.request_id);
            }
            const user = await services_1.userService.getUserById(userId);
            if (!user) {
                return this.sendError(clientId, 'User not found', message.request_id);
            }
            const client = this.clients.get(clientId);
            if (client) {
                client.userId = userId;
                // Create a new session for this socket connection
                const session = await services_1.userService.createSession(userId, user.username);
                client.session = session;
                this.userSessions.set(userId, clientId);
                const response = {
                    status: 'ok',
                    user_id: userId,
                    username: user.username,
                    session_id: session.session_id
                };
                if (message.request_id) {
                    response.request_id = message.request_id;
                }
                this.sendMessage(clientId, response);
            }
        }
        catch (error) {
            console.error('Auth error:', error);
            this.sendError(clientId, 'Authentication failed', message.request_id);
        }
    }
    async handleLogin(clientId, message) {
        try {
            const { username, password } = message;
            if (!username || !password) {
                return this.sendError(clientId, 'Username and password required', message.request_id);
            }
            const user = await services_1.userService.getUserByUsername(username);
            if (!user) {
                return this.sendError(clientId, 'Invalid credentials', message.request_id);
            }
            const isValid = await services_1.userService.verifyPassword(password, user.password);
            if (!isValid) {
                return this.sendError(clientId, 'Invalid credentials', message.request_id);
            }
            const session = await services_1.userService.createSession(user.id, username);
            const client = this.clients.get(clientId);
            if (client) {
                client.userId = user.id;
                client.session = session;
                this.userSessions.set(user.id, clientId);
                const response = {
                    status: 'ok',
                    user_id: user.id,
                    username: user.username,
                    session_id: session.session_id
                };
                if (message.request_id) {
                    response.request_id = message.request_id;
                }
                this.sendMessage(clientId, response);
            }
        }
        catch (error) {
            console.error(`Login error:`, error);
            this.sendError(clientId, 'Login failed', message.request_id);
        }
    }
    async handleRegister(clientId, message) {
        const { username, password } = message;
        if (!username || !password) {
            return this.sendError(clientId, 'Username and password required', message.request_id);
        }
        try {
            const user = await services_1.userService.createUser(username, password);
            const session = await services_1.userService.createSession(user.id, username);
            const client = this.clients.get(clientId);
            if (client) {
                client.userId = user.id;
                client.session = session;
                this.userSessions.set(user.id, clientId);
                const response = {
                    status: 'registered',
                    user_id: user.id,
                    username: user.username,
                    session_id: session.session_id
                };
                if (message.request_id) {
                    response.request_id = message.request_id;
                }
                this.sendMessage(clientId, response);
            }
        }
        catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                return this.sendError(clientId, 'Username already exists', message.request_id);
            }
            throw error;
        }
    }
    async handleGetUserChats(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const chats = await services_1.chatService.getUserChats(client.session.user_id);
        const response = {
            status: 'ok',
            chats
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
    }
    async handleGetChat(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { chatId } = message;
        if (!chatId) {
            return this.sendError(clientId, 'chatId required', message.request_id);
        }
        const chat = await services_1.chatService.getChat(chatId);
        const participants = await services_1.chatService.getChatParticipants(chatId);
        const response = {
            status: 'ok',
            chat: {
                ...chat,
                participants
            }
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
    }
    async handleGetMessages(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { chat_id } = message;
        if (!chat_id) {
            return this.sendError(clientId, 'chat_id required', message.request_id);
        }
        const messages = await services_1.messageService.getMessages(chat_id);
        const response = {
            status: 'ok',
            messages
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
    }
    async handleSendMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { chat_id, content } = message;
        if (!chat_id || !content) {
            return this.sendError(clientId, 'chat_id and content required', message.request_id);
        }
        const msg = await services_1.messageService.sendMessage(chat_id, client.session.user_id, content);
        // Send confirmation to sender
        const response = {
            status: 'ok',
            message_id: msg.id,
            timestamp: msg.timestamp
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
        // Broadcast to other participants
        const participants = await services_1.chatService.getChatParticipants(chat_id);
        for (const participant of participants) {
            if (participant.id !== client.session.user_id) {
                const receiverClientId = this.userSessions.get(participant.id);
                if (receiverClientId) {
                    this.sendMessage(receiverClientId, {
                        type: 'message:new',
                        payload: {
                            id: msg.id,
                            chat_session_id: chat_id,
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
    async handleSearchUsers(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { query } = message;
        if (!query || typeof query !== 'string') {
            return this.sendError(clientId, 'query required', message.request_id);
        }
        const users = await services_1.userService.searchUsers(query, client.session.user_id);
        const response = {
            status: 'ok',
            users
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
    }
    async handleCreateDM(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { other_user_id } = message;
        if (!other_user_id) {
            return this.sendError(clientId, 'other_user_id required', message.request_id);
        }
        const chatId = await services_1.chatService.createOrGetDM(client.session.user_id, other_user_id);
        const chat = await services_1.chatService.getChat(chatId);
        const participants = await services_1.chatService.getChatParticipants(chatId);
        const response = {
            status: 'ok',
            chat_id: chatId,
            chat: {
                ...chat,
                participants
            }
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
    }
    async handleCreateGroup(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { group_name, member_ids } = message;
        if (!group_name || !Array.isArray(member_ids)) {
            return this.sendError(clientId, 'group_name and member_ids required', message.request_id);
        }
        const group = await services_1.chatService.createGroup(group_name, client.session.user_id, member_ids);
        const response = {
            status: 'ok',
            group
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
        // Notify all members about the new group
        const allMembers = [client.session.user_id, ...member_ids];
        for (const memberId of allMembers) {
            const memberClientId = this.userSessions.get(memberId);
            if (memberClientId) {
                this.sendMessage(memberClientId, {
                    type: 'group:created',
                    payload: group
                });
            }
        }
    }
    async handleListGroups(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const groups = await services_1.chatService.listGroups();
        const response = {
            status: 'ok',
            groups
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
    }
    async handleAddGroupMember(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { group_id, user_id } = message;
        if (!group_id || !user_id) {
            return this.sendError(clientId, 'group_id and user_id required', message.request_id);
        }
        await services_1.chatService.addGroupMember(group_id, user_id);
        const response = {
            status: 'ok',
            message: 'Member added'
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
        // Notify the new member
        const memberClientId = this.userSessions.get(user_id);
        if (memberClientId) {
            this.sendMessage(memberClientId, {
                type: 'group:member_added',
                payload: { group_id }
            });
        }
    }
    async handleRemoveGroupMember(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client?.session) {
            return this.sendError(clientId, 'Not authenticated', message.request_id);
        }
        const { group_id, user_id } = message;
        if (!group_id || !user_id) {
            return this.sendError(clientId, 'group_id and user_id required', message.request_id);
        }
        await services_1.chatService.removeGroupMember(group_id, user_id);
        const response = {
            status: 'ok',
            message: 'Member removed'
        };
        if (message.request_id) {
            response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
        // Notify the removed member
        const memberClientId = this.userSessions.get(user_id);
        if (memberClientId) {
            this.sendMessage(memberClientId, {
                type: 'group:member_removed',
                payload: { group_id }
            });
        }
    }
    sendMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && client.socket.writable && !client.socket.destroyed) {
            const json = JSON.stringify(data) + '\n';
            client.socket.write(json, (err) => {
                if (err) {
                    // Only log non-EPIPE errors as they can occur during normal disconnection
                    const errorCode = err.code;
                    if (errorCode !== 'EPIPE') {
                        console.error(`Write error for ${clientId}:`, errorCode || err.message);
                    }
                }
            });
        }
    }
    sendError(clientId, error, requestId) {
        const response = { status: 'error', message: error };
        if (requestId) {
            response.request_id = requestId;
        }
        this.sendMessage(clientId, response);
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