import db from '../database/Database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User, Session, Chat, Message } from '../types';

export class UserService {
  async createUser(username: string, password: string): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(id, username, hashedPassword, createdAt);

    return { id, username, created_at: createdAt };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const stmt = db.prepare('SELECT id, username FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async createSession(userId: string, username: string): Promise<Session> {
    const sessionId = uuidv4();
    const createdAt = new Date().toISOString();

    // Delete any existing sessions for this user
    await this.deleteUserSessions(userId);

    const stmt = db.prepare(
      'INSERT INTO sessions (session_id, user_id, created_at) VALUES (?, ?, ?)'
    );
    stmt.run(sessionId, userId, createdAt);

    return { session_id: sessionId, user_id: userId, username, created_at: createdAt };
  }

  async verifySession(sessionToken: string): Promise<User | null> {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.created_at
      FROM users u
      JOIN sessions s ON u.id = s.user_id
      WHERE s.session_id = ?
    `);
    return stmt.get(sessionToken) as User | null;
  }

  async deleteSession(sessionToken: string): Promise<boolean> {
    const stmt = db.prepare('DELETE FROM sessions WHERE session_id = ?');
    const result = stmt.run(sessionToken);
    return result.changes > 0;
  }

  async deleteUserSessions(userId: string): Promise<number> {
    const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    let sql = 'SELECT id, username FROM users WHERE username LIKE ?';
    const params: any[] = [`%${query}%`];

    if (excludeUserId) {
      sql += ' AND id != ?';
      params.push(excludeUserId);
    }

    sql += ' LIMIT 10';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as User[];
  }
}

export class ChatService {
  async getUserChats(userId: string): Promise<any[]> {
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

    const stmt = db.prepare(query);
    const rows = stmt.all(userId) as any[];

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

  private getChatParticipantsSync(chatId: string): User[] {
    const query = `
      SELECT u.id, u.username FROM users u
      JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_session_id = ?
    `;
    const stmt = db.prepare(query);
    return stmt.all(chatId) as User[];
  }

  async getChat(chatId: string): Promise<any> {
    const query = `
      SELECT cs.*, g.name as group_name, g.creator_id as group_creator_id
      FROM chat_sessions cs
      LEFT JOIN groups g ON cs.group_id = g.id
      WHERE cs.id = ?
    `;
    const stmt = db.prepare(query);
    return stmt.get(chatId);
  }

  async getChatParticipants(chatId: string): Promise<User[]> {
    const query = `
      SELECT u.id, u.username FROM users u
      JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_session_id = ?
    `;
    const stmt = db.prepare(query);
    return stmt.all(chatId) as User[];
  }

  async createOrGetDM(userId1: string, userId2: string): Promise<string> {
    // Check if DM already exists
    const checkQuery = `
      SELECT cs.id FROM chat_sessions cs
      WHERE cs.type = 'dm' AND cs.id IN (
        SELECT chat_session_id FROM chat_participants WHERE user_id = ?
      ) AND cs.id IN (
        SELECT chat_session_id FROM chat_participants WHERE user_id = ?
      )
    `;
    const checkStmt = db.prepare(checkQuery);
    const existing = checkStmt.get(userId1, userId2) as any;
    if (existing) return existing.id;

    // Create new DM
    const chatId = uuidv4();
    const createdAt = new Date().toISOString();

    db.transaction(() => {
      const insertChat = db.prepare(
        'INSERT INTO chat_sessions (id, type, created_at, updated_at) VALUES (?, ?, ?, ?)'
      );
      insertChat.run(chatId, 'dm', createdAt, createdAt);

      const insertP1 = db.prepare(
        'INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)'
      );
      insertP1.run(uuidv4(), chatId, userId1, createdAt);

      const insertP2 = db.prepare(
        'INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)'
      );
      insertP2.run(uuidv4(), chatId, userId2, createdAt);
    });

    return chatId;
  }

  async createGroup(groupName: string, creatorId: string, memberIds: string[]): Promise<any> {
    const groupId = uuidv4();
    const chatId = uuidv4();
    const createdAt = new Date().toISOString();

    db.transaction(() => {
      // Create group
      const insertGroup = db.prepare(
        'INSERT INTO groups (id, name, creator_id, created_at) VALUES (?, ?, ?, ?)'
      );
      insertGroup.run(groupId, groupName, creatorId, createdAt);

      // Create chat session for group
      const insertChat = db.prepare(
        'INSERT INTO chat_sessions (id, type, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      insertChat.run(chatId, 'group', groupId, createdAt, createdAt);

      // Add all members (including creator)
      const allMembers = [creatorId, ...memberIds.filter(id => id !== creatorId)];
      const insertParticipant = db.prepare(
        'INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)'
      );

      for (const memberId of allMembers) {
        insertParticipant.run(uuidv4(), chatId, memberId, createdAt);
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

  async getGroup(groupId: string): Promise<any> {
    const stmt = db.prepare('SELECT * FROM groups WHERE id = ?');
    return stmt.get(groupId);
  }

  async addGroupMember(groupId: string, userId: string): Promise<void> {
    // Get chat_session_id for this group
    const getChatStmt = db.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
    const chatSession = getChatStmt.get(groupId) as any;

    if (!chatSession) throw new Error('Group not found');

    const createdAt = new Date().toISOString();
    db.transaction(() => {
      const stmt = db.prepare(
        'INSERT INTO chat_participants (id, chat_session_id, user_id, joined_at) VALUES (?, ?, ?, ?)'
      );
      stmt.run(uuidv4(), chatSession.id, userId, createdAt);

      // Update chat session's updated_at
      const updateStmt = db.prepare(
        'UPDATE chat_sessions SET updated_at = ? WHERE id = ?'
      );
      updateStmt.run(createdAt, chatSession.id);
    });
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    // Get chat_session_id for this group
    const getChatStmt = db.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
    const chatSession = getChatStmt.get(groupId) as any;

    if (!chatSession) throw new Error('Group not found');

    const updatedAt = new Date().toISOString();
    db.transaction(() => {
      const stmt = db.prepare(
        'DELETE FROM chat_participants WHERE chat_session_id = ? AND user_id = ?'
      );
      stmt.run(chatSession.id, userId);

      // Update chat session's updated_at
      const updateStmt = db.prepare(
        'UPDATE chat_sessions SET updated_at = ? WHERE id = ?'
      );
      updateStmt.run(updatedAt, chatSession.id);
    });
  }

  async updateGroupName(groupId: string, newName: string): Promise<void> {
    // Get chat_session_id for this group
    const getChatStmt = db.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
    const chatSession = getChatStmt.get(groupId) as any;

    if (!chatSession) throw new Error('Group not found');

    const updatedAt = new Date().toISOString();
    db.transaction(() => {
      const stmt = db.prepare('UPDATE groups SET name = ? WHERE id = ?');
      stmt.run(newName, groupId);

      // Update chat session's updated_at
      const updateStmt = db.prepare(
        'UPDATE chat_sessions SET updated_at = ? WHERE id = ?'
      );
      updateStmt.run(updatedAt, chatSession.id);
    });
  }

  async deleteGroup(groupId: string): Promise<void> {
    // Get chat_session_id for this group
    const getChatStmt = db.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
    const chatSession = getChatStmt.get(groupId) as any;

    if (!chatSession) throw new Error('Group not found');

    // Delete messages first (due to foreign key constraints)
    const deleteMessagesStmt = db.prepare('DELETE FROM messages WHERE chat_session_id = ?');
    deleteMessagesStmt.run(chatSession.id);

    // Delete participants
    const deleteParticipantsStmt = db.prepare('DELETE FROM chat_participants WHERE chat_session_id = ?');
    deleteParticipantsStmt.run(chatSession.id);

    // Delete chat session
    const deleteChatStmt = db.prepare('DELETE FROM chat_sessions WHERE id = ?');
    deleteChatStmt.run(chatSession.id);

    // Delete group
    const deleteGroupStmt = db.prepare('DELETE FROM groups WHERE id = ?');
    deleteGroupStmt.run(groupId);
  }

  async listGroups(): Promise<any[]> {
    const stmt = db.prepare(`
      SELECT g.id, g.name, g.creator_id, g.created_at,
        (SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_session_id = (SELECT id FROM chat_sessions WHERE group_id = g.id)) as member_count
      FROM groups g
      ORDER BY g.created_at DESC
    `);
    return stmt.all() as any[];
  }
}

export class MessageService {
  async sendMessage(chatId: string, senderId: string, content: string): Promise<Message> {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    db.transaction(() => {
      const stmt = db.prepare(
        'INSERT INTO messages (id, chat_session_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(id, chatId, senderId, content, timestamp);

      // Update chat session's updated_at
      const updateStmt = db.prepare(
        'UPDATE chat_sessions SET updated_at = ? WHERE id = ?'
      );
      updateStmt.run(timestamp, chatId);
    });

    return { id, chat_session_id: chatId, sender_id: senderId, content, timestamp };
  }

  async getMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    const query = `
      SELECT m.id, m.content, m.timestamp, m.sender_id, m.chat_session_id,
        u.username as sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_session_id = ?
      ORDER BY m.timestamp DESC
      LIMIT ?
    `;
    const stmt = db.prepare(query);
    const messages = stmt.all(chatId, limit) as Message[];
    return messages.reverse(); // Return in chronological order
  }
}

export const userService = new UserService();
export const chatService = new ChatService();
export const messageService = new MessageService();
