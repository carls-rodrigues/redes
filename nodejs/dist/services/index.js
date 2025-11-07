"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = exports.chatService = exports.userService = exports.MessageService = exports.ChatService = exports.UserService = void 0;
const Database_1 = __importDefault(require("../database/Database"));
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
    async createUser(username, password) {
        const id = (0, uuid_1.v4)();
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const createdAt = new Date().toISOString();
        const stmt = Database_1.default.prepare('INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)');
        stmt.run(id, username, hashedPassword, createdAt);
        return { id, username, created_at: createdAt };
    }
    async getUserByUsername(username) {
        const stmt = Database_1.default.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username);
    }
    async getUserById(id) {
        const stmt = Database_1.default.prepare('SELECT id, username FROM users WHERE id = ?');
        return stmt.get(id);
    }
    async verifyPassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    async createSession(userId, username) {
        const sessionId = (0, uuid_1.v4)();
        const createdAt = new Date().toISOString();
        const stmt = Database_1.default.prepare('INSERT INTO sessions (session_id, user_id, created_at) VALUES (?, ?, ?)');
        stmt.run(sessionId, userId, createdAt);
        return { session_id: sessionId, user_id: userId, username, created_at: createdAt };
    }
    async searchUsers(query, excludeUserId) {
        let sql = 'SELECT id, username FROM users WHERE username LIKE ?';
        const params = [`%${query}%`];
        if (excludeUserId) {
            sql += ' AND id != ?';
            params.push(excludeUserId);
        }
        sql += ' LIMIT 10';
        const stmt = Database_1.default.prepare(sql);
        return stmt.all(...params);
    }
}
exports.UserService = UserService;
class ChatService {
    async getUserChats(userId) {
        const query = `
      SELECT cs.id, cs.type, cs.group_id, cs.created_at,
        (SELECT content FROM messages WHERE chat_session_id = cs.id ORDER BY timestamp DESC LIMIT 1) as last_message_content,
        (SELECT timestamp FROM messages WHERE chat_session_id = cs.id ORDER BY timestamp DESC LIMIT 1) as last_message_timestamp,
        (SELECT sender_id FROM messages WHERE chat_session_id = cs.id ORDER BY timestamp DESC LIMIT 1) as last_sender_id
      FROM chat_sessions cs
      WHERE cs.id IN (
        SELECT chat_session_id FROM chat_participants WHERE user_id = ?
      )
      ORDER BY last_message_timestamp DESC NULLS LAST
    `;
        const stmt = Database_1.default.prepare(query);
        const rows = stmt.all(userId);
        return rows.map(chat => {
            const participants = this.getChatParticipantsSync(chat.id);
            return {
                id: chat.id,
                type: chat.type,
                group_id: chat.group_id,
                created_at: chat.created_at,
                participants,
                last_message: chat.last_message_content || 'Nenhuma mensagem ainda',
                last_message_time: chat.last_message_timestamp
            };
        });
    }
    getChatParticipantsSync(chatId) {
        const query = `
      SELECT u.id, u.username FROM users u
      JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_session_id = ?
    `;
        const stmt = Database_1.default.prepare(query);
        return stmt.all(chatId);
    }
    async getChat(chatId) {
        const stmt = Database_1.default.prepare('SELECT * FROM chat_sessions WHERE id = ?');
        return stmt.get(chatId);
    }
    async getChatParticipants(chatId) {
        const query = `
      SELECT u.id, u.username FROM users u
      JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_session_id = ?
    `;
        const stmt = Database_1.default.prepare(query);
        return stmt.all(chatId);
    }
    async createOrGetDM(userId1, userId2) {
        // Check if DM already exists
        const checkQuery = `
      SELECT cs.id FROM chat_sessions cs
      WHERE cs.type = 'dm' AND cs.id IN (
        SELECT chat_session_id FROM chat_participants WHERE user_id = ?
      ) AND cs.id IN (
        SELECT chat_session_id FROM chat_participants WHERE user_id = ?
      )
    `;
        const checkStmt = Database_1.default.prepare(checkQuery);
        const existing = checkStmt.get(userId1, userId2);
        if (existing)
            return existing.id;
        // Create new DM
        const chatId = (0, uuid_1.v4)();
        const createdAt = new Date().toISOString();
        Database_1.default.transaction(() => {
            const insertChat = Database_1.default.prepare('INSERT INTO chat_sessions (id, type, created_at) VALUES (?, ?, ?)');
            insertChat.run(chatId, 'dm', createdAt);
            const insertP1 = Database_1.default.prepare('INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)');
            insertP1.run((0, uuid_1.v4)(), chatId, userId1, createdAt);
            const insertP2 = Database_1.default.prepare('INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)');
            insertP2.run((0, uuid_1.v4)(), chatId, userId2, createdAt);
        });
        return chatId;
    }
    async createGroup(groupName, creatorId, memberIds) {
        const groupId = (0, uuid_1.v4)();
        const chatId = (0, uuid_1.v4)();
        const createdAt = new Date().toISOString();
        Database_1.default.transaction(() => {
            // Create group
            const insertGroup = Database_1.default.prepare('INSERT INTO groups (id, name, creator_id, created_at) VALUES (?, ?, ?, ?)');
            insertGroup.run(groupId, groupName, creatorId, createdAt);
            // Create chat session for group
            const insertChat = Database_1.default.prepare('INSERT INTO chat_sessions (id, type, group_id, created_at) VALUES (?, ?, ?, ?)');
            insertChat.run(chatId, 'group', groupId, createdAt);
            // Add all members (including creator)
            const allMembers = [creatorId, ...memberIds.filter(id => id !== creatorId)];
            const insertParticipant = Database_1.default.prepare('INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)');
            for (const memberId of allMembers) {
                insertParticipant.run((0, uuid_1.v4)(), chatId, memberId, createdAt);
            }
        });
        return {
            group_id: groupId,
            chat_id: chatId,
            name: groupName,
            creator_id: creatorId,
            created_at: createdAt,
            members: memberIds
        };
    }
    async getGroup(groupId) {
        const stmt = Database_1.default.prepare('SELECT * FROM groups WHERE id = ?');
        return stmt.get(groupId);
    }
    async addGroupMember(groupId, userId) {
        // Get chat_session_id for this group
        const getChatStmt = Database_1.default.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
        const chatSession = getChatStmt.get(groupId);
        if (!chatSession)
            throw new Error('Group not found');
        const createdAt = new Date().toISOString();
        const stmt = Database_1.default.prepare('INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)');
        stmt.run((0, uuid_1.v4)(), chatSession.id, userId, createdAt);
    }
    async removeGroupMember(groupId, userId) {
        // Get chat_session_id for this group
        const getChatStmt = Database_1.default.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
        const chatSession = getChatStmt.get(groupId);
        if (!chatSession)
            throw new Error('Group not found');
        const stmt = Database_1.default.prepare('DELETE FROM chat_participants WHERE chat_session_id = ? AND user_id = ?');
        stmt.run(chatSession.id, userId);
    }
    async listGroups() {
        const stmt = Database_1.default.prepare(`
      SELECT g.id, g.name, g.creator_id, g.created_at,
        (SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_session_id = (SELECT id FROM chat_sessions WHERE group_id = g.id)) as member_count
      FROM groups g
      ORDER BY g.created_at DESC
    `);
        return stmt.all();
    }
}
exports.ChatService = ChatService;
class MessageService {
    async sendMessage(chatId, senderId, content) {
        const id = (0, uuid_1.v4)();
        const timestamp = new Date().toISOString();
        const stmt = Database_1.default.prepare('INSERT INTO messages (id, chat_session_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, chatId, senderId, content, timestamp);
        return { id, chat_session_id: chatId, sender_id: senderId, content, timestamp };
    }
    async getMessages(chatId, limit = 50) {
        const query = `
      SELECT m.id, m.content, m.timestamp, m.sender_id, m.chat_session_id,
        u.username as sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_session_id = ?
      ORDER BY m.timestamp DESC
      LIMIT ?
    `;
        const stmt = Database_1.default.prepare(query);
        const messages = stmt.all(chatId, limit);
        return messages.reverse(); // Return in chronological order
    }
}
exports.MessageService = MessageService;
exports.userService = new UserService();
exports.chatService = new ChatService();
exports.messageService = new MessageService();
//# sourceMappingURL=index.js.map