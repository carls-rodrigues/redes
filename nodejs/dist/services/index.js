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
        // Delete any existing sessions for this user
        await this.deleteUserSessions(userId);
        const stmt = Database_1.default.prepare('INSERT INTO sessions (session_id, user_id, created_at) VALUES (?, ?, ?)');
        stmt.run(sessionId, userId, createdAt);
        return { session_id: sessionId, user_id: userId, username, created_at: createdAt };
    }
    async verifySession(sessionToken) {
        const stmt = Database_1.default.prepare(`
      SELECT u.id, u.username, u.created_at
      FROM users u
      JOIN sessions s ON u.id = s.user_id
      WHERE s.session_id = ?
    `);
        return stmt.get(sessionToken);
    }
    async deleteSession(sessionToken) {
        const stmt = Database_1.default.prepare('DELETE FROM sessions WHERE session_id = ?');
        const result = stmt.run(sessionToken);
        return result.changes > 0;
    }
    async deleteUserSessions(userId) {
        const stmt = Database_1.default.prepare('DELETE FROM sessions WHERE user_id = ?');
        const result = stmt.run(userId);
        return result.changes;
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
      SELECT cs.id, cs.type, cs.group_id, cs.created_at, cs.updated_at,
        (SELECT content FROM messages WHERE chat_session_id = cs.id ORDER BY timestamp DESC LIMIT 1) as last_message_content,
        (SELECT timestamp FROM messages WHERE chat_session_id = cs.id ORDER BY timestamp DESC LIMIT 1) as last_message_timestamp,
        (SELECT sender_id FROM messages WHERE chat_session_id = cs.id ORDER BY timestamp DESC LIMIT 1) as last_sender_id,
        g.name as group_name,
        g.creator_id as group_creator_id
      FROM chat_sessions cs
      LEFT JOIN groups g ON cs.group_id = g.id
      WHERE cs.id IN (
        SELECT chat_session_id FROM chat_participants WHERE user_id = ?
      )
      ORDER BY cs.updated_at DESC NULLS LAST
    `;
        const stmt = Database_1.default.prepare(query);
        const rows = stmt.all(userId);
        return rows.map(chat => {
            const participants = this.getChatParticipantsSync(chat.id);
            return {
                id: chat.id,
                type: chat.type,
                group_id: chat.group_id,
                group_name: chat.group_name,
                group_creator_id: chat.group_creator_id,
                created_at: chat.created_at,
                updated_at: chat.updated_at,
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
        const query = `
      SELECT cs.*, g.name as group_name, g.creator_id as group_creator_id
      FROM chat_sessions cs
      LEFT JOIN groups g ON cs.group_id = g.id
      WHERE cs.id = ?
    `;
        const stmt = Database_1.default.prepare(query);
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
            const insertChat = Database_1.default.prepare('INSERT INTO chat_sessions (id, type, created_at, updated_at) VALUES (?, ?, ?, ?)');
            insertChat.run(chatId, 'dm', createdAt, createdAt);
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
            const insertChat = Database_1.default.prepare('INSERT INTO chat_sessions (id, type, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
            insertChat.run(chatId, 'group', groupId, createdAt, createdAt);
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
        Database_1.default.transaction(() => {
            const stmt = Database_1.default.prepare('INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)');
            stmt.run((0, uuid_1.v4)(), chatSession.id, userId, createdAt);
            // Update chat session's updated_at
            const updateStmt = Database_1.default.prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?');
            updateStmt.run(createdAt, chatSession.id);
        });
    }
    async removeGroupMember(groupId, userId) {
        // Get chat_session_id for this group
        const getChatStmt = Database_1.default.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
        const chatSession = getChatStmt.get(groupId);
        if (!chatSession)
            throw new Error('Group not found');
        const updatedAt = new Date().toISOString();
        Database_1.default.transaction(() => {
            const stmt = Database_1.default.prepare('DELETE FROM chat_participants WHERE chat_session_id = ? AND user_id = ?');
            stmt.run(chatSession.id, userId);
            // Update chat session's updated_at
            const updateStmt = Database_1.default.prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?');
            updateStmt.run(updatedAt, chatSession.id);
        });
    }
    async updateGroupName(groupId, newName) {
        // Get chat_session_id for this group
        const getChatStmt = Database_1.default.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
        const chatSession = getChatStmt.get(groupId);
        if (!chatSession)
            throw new Error('Group not found');
        const updatedAt = new Date().toISOString();
        Database_1.default.transaction(() => {
            const stmt = Database_1.default.prepare('UPDATE groups SET name = ? WHERE id = ?');
            stmt.run(newName, groupId);
            // Update chat session's updated_at
            const updateStmt = Database_1.default.prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?');
            updateStmt.run(updatedAt, chatSession.id);
        });
    }
    async deleteGroup(groupId) {
        // Get chat_session_id for this group
        const getChatStmt = Database_1.default.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
        const chatSession = getChatStmt.get(groupId);
        if (!chatSession)
            throw new Error('Group not found');
        // Delete messages first (due to foreign key constraints)
        const deleteMessagesStmt = Database_1.default.prepare('DELETE FROM messages WHERE chat_session_id = ?');
        deleteMessagesStmt.run(chatSession.id);
        // Delete participants
        const deleteParticipantsStmt = Database_1.default.prepare('DELETE FROM chat_participants WHERE chat_session_id = ?');
        deleteParticipantsStmt.run(chatSession.id);
        // Delete chat session
        const deleteChatStmt = Database_1.default.prepare('DELETE FROM chat_sessions WHERE id = ?');
        deleteChatStmt.run(chatSession.id);
        // Delete group
        const deleteGroupStmt = Database_1.default.prepare('DELETE FROM groups WHERE id = ?');
        deleteGroupStmt.run(groupId);
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
        Database_1.default.transaction(() => {
            const stmt = Database_1.default.prepare('INSERT INTO messages (id, chat_session_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?, ?)');
            stmt.run(id, chatId, senderId, content, timestamp);
            // Update chat session's updated_at
            const updateStmt = Database_1.default.prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?');
            updateStmt.run(timestamp, chatId);
        });
        return { id, chat_session_id: chatId, sender_id: senderId, content, timestamp };
    }
    async getMessages(chatId, userId, limit = 50) {
        // If userId is provided, mark unread messages from other users as read
        if (userId) {
            const markAsReadStmt = Database_1.default.prepare(`
        UPDATE messages 
        SET read_at = ?, read_by = ? 
        WHERE chat_session_id = ? 
        AND sender_id != ? 
        AND (read_at IS NULL OR read_by IS NULL)
      `);
            markAsReadStmt.run(new Date().toISOString(), JSON.stringify([userId]), chatId, userId);
        }
        const query = `
      SELECT m.id, m.content, m.timestamp, m.sender_id, m.chat_session_id, m.read_at, m.read_by,
        u.username as sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_session_id = ?
      ORDER BY m.timestamp DESC
      LIMIT ?
    `;
        const stmt = Database_1.default.prepare(query);
        const messages = stmt.all(chatId, limit);
        // Parse read_by JSON for each message
        const parsedMessages = messages.map(msg => ({
            ...msg,
            read_by: msg.read_by ? JSON.parse(msg.read_by) : null
        }));
        return parsedMessages.reverse(); // Return in chronological order
    }
    async markMessagesAsRead(chatId, userId, messageIds) {
        const now = new Date().toISOString();
        if (messageIds && messageIds.length > 0) {
            // Mark specific messages as read
            for (const messageId of messageIds) {
                // Get current read_by value
                const getStmt = Database_1.default.prepare('SELECT read_by FROM messages WHERE id = ?');
                const current = getStmt.get(messageId);
                let readByArray = [];
                if (current?.read_by) {
                    try {
                        readByArray = JSON.parse(current.read_by);
                    }
                    catch (e) {
                        // If it's not JSON, treat as single user
                        readByArray = [current.read_by];
                    }
                }
                // Add user if not already in the array
                if (!readByArray.includes(userId)) {
                    readByArray.push(userId);
                }
                const stmt = Database_1.default.prepare(`
          UPDATE messages 
          SET read_at = ?, read_by = ? 
          WHERE id = ? 
          AND sender_id != ?
          AND (read_at IS NULL OR read_by IS NULL OR read_by NOT LIKE ?)
        `);
                stmt.run(now, JSON.stringify(readByArray), messageId, userId, `%${userId}%`);
            }
        }
        else {
            // Mark all unread messages in the chat as read
            const getUnreadStmt = Database_1.default.prepare(`
        SELECT id, read_by FROM messages 
        WHERE chat_session_id = ? 
        AND sender_id != ?
        AND (read_at IS NULL OR read_by IS NULL)
      `);
            const unreadMessages = getUnreadStmt.all(chatId, userId);
            for (const message of unreadMessages) {
                let readByArray = [];
                if (message.read_by) {
                    try {
                        readByArray = JSON.parse(message.read_by);
                    }
                    catch (e) {
                        readByArray = [message.read_by];
                    }
                }
                if (!readByArray.includes(userId)) {
                    readByArray.push(userId);
                }
                const stmt = Database_1.default.prepare(`
          UPDATE messages 
          SET read_at = ?, read_by = ? 
          WHERE id = ?
        `);
                stmt.run(now, JSON.stringify(readByArray), message.id);
            }
        }
    }
}
exports.MessageService = MessageService;
exports.userService = new UserService();
exports.chatService = new ChatService();
exports.messageService = new MessageService();
//# sourceMappingURL=index.js.map