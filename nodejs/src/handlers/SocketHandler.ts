import { Socket } from 'net';
import { userService, chatService, messageService } from '../services';
import { SocketMessage, Session } from '../types';
import db from '../database/Database';

interface ClientInfo {
  userId?: string;
  socket: Socket;
  session?: Session;
  isWebSocket?: boolean;
  sendMessage?: (message: any) => void;
}

export class SocketHandler {
  private clients: Map<string, ClientInfo> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> clientId
  private sendWebSocketMessage?: (socket: Socket, data: any) => void;

  constructor() {}

  setSendWebSocketMessage(fn: (socket: Socket, data: any) => void) {
    this.sendWebSocketMessage = fn;
  }

  registerClient(clientId: string, socket: Socket) {
    this.clients.set(clientId, { socket, isWebSocket: false });
  }

  registerWebSocketClient(clientId: string, socket: Socket) {
    const sendMessage = (message: any) => {
      if (this.sendWebSocketMessage) {
        this.sendWebSocketMessage(socket, message);
      }
    };

    this.clients.set(clientId, { socket, isWebSocket: true, sendMessage });
  }

  unregisterClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client?.userId) {
      this.userSessions.delete(client.userId);
    }
    this.clients.delete(clientId);
  }

  async handleMessage(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

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
        case 'update_group_name':
          await this.handleUpdateGroupName(clientId, message);
          break;
        case 'delete_group':
          await this.handleDeleteGroup(clientId, message);
          break;
        case 'logout':
          await this.handleLogout(clientId, message);
          break;
      }
    } catch (error) {
      this.sendError(clientId, 'Internal server error', message.request_id);
      console.error('Error handling message:', error);
    }
  }

  private async handleAuth(clientId: string, message: SocketMessage) {
    try {
      const { token } = message;
      if (!token) {
        return this.sendError(clientId, 'token required', message.request_id);
      }

      const user = await userService.verifySession(token);
      if (!user) {
        return this.sendError(clientId, 'Invalid session', message.request_id);
      }

      const client = this.clients.get(clientId);
      if (client) {
        client.userId = user.id;
        // Create a session object for this connection
        const session = {
          session_id: token,
          user_id: user.id,
          username: user.username,
          created_at: new Date().toISOString()
        };
        client.session = session;
        this.userSessions.set(user.id, clientId);

        const response: any = {
          status: 'ok',
          user: user,
          session: session
        };
        if (message.request_id) {
          response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.sendError(clientId, 'Authentication failed', message.request_id);
    }
  }

  private async handleLogin(clientId: string, message: SocketMessage) {
    try {
      const { username, password } = message;
      if (!username || !password) {
        return this.sendError(clientId, 'Username and password required', message.request_id);
      }

      const user = await userService.getUserByUsername(username);
      if (!user) {
        return this.sendError(clientId, 'Invalid credentials', message.request_id);
      }

      const isValid = await userService.verifyPassword(password, user.password!);
      if (!isValid) {
        return this.sendError(clientId, 'Invalid credentials', message.request_id);
      }

      const session = await userService.createSession(user.id, username);
      const client = this.clients.get(clientId);
      if (client) {
        client.userId = user.id;
        client.session = session;
        this.userSessions.set(user.id, clientId);

        const response: any = {
          status: 'ok',
          user: {
            id: user.id,
            username: user.username
          },
          session: session
        };
        if (message.request_id) {
          response.request_id = message.request_id;
        }
        this.sendMessage(clientId, response);
      }
    } catch (error) {
      console.error(`Login error:`, error);
      this.sendError(clientId, 'Login failed', message.request_id);
    }
  }

  private async handleRegister(clientId: string, message: SocketMessage) {
    const { username, password } = message;
    if (!username || !password) {
      return this.sendError(clientId, 'Username and password required', message.request_id);
    }

    try {
      const user = await userService.createUser(username, password);
      const session = await userService.createSession(user.id, username);
      
      const client = this.clients.get(clientId);
      if (client) {
        client.userId = user.id;
        client.session = session;
        this.userSessions.set(user.id, clientId);

        const response: any = {
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
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return this.sendError(clientId, 'Username already exists', message.request_id);
      }
      throw error;
    }
  }

  private async handleGetUserChats(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const chats = await chatService.getUserChats(client.session.user_id);
    const response: any = {
      status: 'ok',
      chats
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);
  }

  private async handleGetChat(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { chatId } = message;
    if (!chatId) {
      return this.sendError(clientId, 'chatId required', message.request_id);
    }

    const chat = await chatService.getChat(chatId);
    const participants = await chatService.getChatParticipants(chatId);
    
    const response: any = {
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

  private async handleGetMessages(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { chat_id } = message;
    if (!chat_id) {
      return this.sendError(clientId, 'chat_id required', message.request_id);
    }

    const messages = await messageService.getMessages(chat_id);
    const response: any = {
      status: 'ok',
      messages
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);
  }

  private async handleSendMessage(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { chat_id, content } = message;
    if (!chat_id || !content) {
      return this.sendError(clientId, 'chat_id and content required', message.request_id);
    }

    const msg = await messageService.sendMessage(chat_id, client.session.user_id, content);

    // Send confirmation to sender
    const response: any = {
      status: 'ok',
      message_id: msg.id,
      timestamp: msg.timestamp
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);

    // Broadcast message to ALL participants (including sender)
    const participants = await chatService.getChatParticipants(chat_id);
    for (const participant of participants) {
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

  private async handleSearchUsers(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { query } = message;
    if (query === undefined || (typeof query === 'string' && query === '')) {
      // Allow empty query to search all users
      const users = await userService.searchUsers('%', client.session.user_id);
      const response: any = {
        status: 'ok',
        users
      };
      if (message.request_id) {
        response.request_id = message.request_id;
      }
      this.sendMessage(clientId, response);
      return;
    }

    if (typeof query !== 'string') {
      return this.sendError(clientId, 'query must be a string', message.request_id);
    }

    const users = await userService.searchUsers(query, client.session.user_id);
    const response: any = {
      status: 'ok',
      users
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);
  }

  private async handleCreateDM(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { other_user_id } = message;
    if (!other_user_id) {
      return this.sendError(clientId, 'other_user_id required', message.request_id);
    }

    const chatId = await chatService.createOrGetDM(client.session.user_id, other_user_id);
    const chat = await chatService.getChat(chatId);
    const participants = await chatService.getChatParticipants(chatId);

    const response: any = {
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

  private async handleCreateGroup(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { group_name, member_ids } = message;
    if (!group_name || !Array.isArray(member_ids)) {
      return this.sendError(clientId, 'group_name and member_ids required', message.request_id);
    }

    const group = await chatService.createGroup(group_name, client.session.user_id, member_ids);
    const response: any = {
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

  private async handleListGroups(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const groups = await chatService.listGroups();
    const response: any = {
      status: 'ok',
      groups
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);
  }

  private async handleAddGroupMember(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { group_id, user_id } = message;
    if (!group_id || !user_id) {
      return this.sendError(clientId, 'group_id and user_id required', message.request_id);
    }

    await chatService.addGroupMember(group_id, user_id);
    const response: any = {
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

  private async handleRemoveGroupMember(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { group_id, user_id } = message;
    if (!group_id || !user_id) {
      return this.sendError(clientId, 'group_id and user_id required', message.request_id);
    }

    // Check if user is the group creator
    const getGroupStmt = db.prepare('SELECT creator_id FROM groups WHERE id = ?');
    const group = getGroupStmt.get(group_id) as any;
    
    if (!group) {
      return this.sendError(clientId, 'Group not found', message.request_id);
    }

    if (group.creator_id !== client.session.user_id) {
      return this.sendError(clientId, 'Only group owner can remove members', message.request_id);
    }

    await chatService.removeGroupMember(group_id, user_id);
    const response: any = {
      status: 'ok',
      message: 'Member removed'
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);

    // Notify the removed member
    for (const [cId, c] of this.clients) {
      if (c.session?.user_id === user_id) {
        this.sendMessage(cId, {
          type: 'group:member_removed',
          payload: { group_id }
        });
        break;
      }
    }
  }

  private async handleUpdateGroupName(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { group_id, new_name } = message;
    if (!group_id || !new_name) {
      return this.sendError(clientId, 'group_id and new_name required', message.request_id);
    }

    // Check if user is the group creator
    const getGroupStmt = db.prepare('SELECT creator_id FROM groups WHERE id = ?');
    const group = getGroupStmt.get(group_id) as any;
    
    if (!group) {
      return this.sendError(clientId, 'Group not found', message.request_id);
    }

    if (group.creator_id !== client.session.user_id) {
      return this.sendError(clientId, 'Only group owner can update group name', message.request_id);
    }

    await chatService.updateGroupName(group_id, new_name);
    const response: any = {
      status: 'ok',
      message: 'Group name updated'
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);

    // Notify all group members about the name change
    const getChatStmt = db.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
    const chatSession = getChatStmt.get(group_id) as any;
    if (chatSession) {
      const getMembersStmt = db.prepare('SELECT DISTINCT user_id FROM chat_participants WHERE chat_session_id = ?');
      const members = getMembersStmt.all(chatSession.id) as any[];
      
      members.forEach(member => {
        const memberClientId = this.userSessions.get(member.user_id);
        if (memberClientId) {
          this.sendMessage(memberClientId, {
            type: 'group:name_updated',
            payload: { group_id, new_name }
          });
        }
      });
    }
  }

  private sendMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.isWebSocket && client.sendMessage) {
      // WebSocket client
      client.sendMessage(data);
    } else if (client.socket.writable && !client.socket.destroyed) {
      // TCP socket client
      const json = JSON.stringify(data) + '\n';
      client.socket.write(json, (err) => {
        if (err) {
          // Only log non-EPIPE errors as they can occur during normal disconnection
          const errorCode = (err as any).code;
          if (errorCode !== 'EPIPE') {
            console.error(`Write error for ${clientId}:`, errorCode || err.message);
          }
        }
      });
    }
  }

  private sendError(clientId: string, error: string, requestId?: string) {
    const response: any = { status: 'error', message: error };
    if (requestId) {
      response.request_id = requestId;
    }
    this.sendMessage(clientId, response);
  }

  private async handleDeleteGroup(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { group_id } = message;

    if (!group_id) {
      return this.sendError(clientId, 'group_id required', message.request_id);
    }

    const getGroupStmt = db.prepare('SELECT creator_id FROM groups WHERE id = ?');
    const group = getGroupStmt.get(group_id) as any;

    if (!group) {
      return this.sendError(clientId, 'Group not found', message.request_id);
    }

    // Only group owner can delete the group
    if (group.creator_id !== client.session.user_id) {
      return this.sendError(clientId, 'Only group owner can delete group', message.request_id);
    }

    try {
      // Get participants BEFORE deleting
      const getChatStmt = db.prepare('SELECT id FROM chat_sessions WHERE group_id = ?');
      const chatSession = getChatStmt.get(group_id) as any;
      let participants: any[] = [];
      
      if (chatSession) {
        const getParticipantsStmt = db.prepare('SELECT user_id FROM chat_participants WHERE chat_session_id = ?');
        participants = getParticipantsStmt.all(chatSession.id) as any[];
      }

      // Delete messages first (due to foreign key constraints)
      if (chatSession) {
        const deleteMessagesStmt = db.prepare('DELETE FROM messages WHERE chat_session_id = ?');
        deleteMessagesStmt.run(chatSession.id);
      }

      // Delete chat participants
      const deleteParticipantsStmt = db.prepare('DELETE FROM chat_participants WHERE chat_session_id = ?');
      if (chatSession) {
        deleteParticipantsStmt.run(chatSession.id);
      }

      // Delete chat session associated with this group
      const deleteChatStmt = db.prepare('DELETE FROM chat_sessions WHERE group_id = ?');
      deleteChatStmt.run(group_id);

      // Delete group
      const deleteGroupStmt = db.prepare('DELETE FROM groups WHERE id = ?');
      deleteGroupStmt.run(group_id);

      const response = {
        status: 'ok',
        type: 'delete_group',
        request_id: message.request_id,
        message: 'Group deleted successfully'
      };

      this.sendMessage(clientId, response);

      // Notify all group members that group has been deleted
      const notification = {
        type: 'group:deleted',
        payload: {
          group_id,
          message: 'Group has been deleted by the owner'
        }
      };

      participants.forEach(p => {
        // Find client for this user
        for (const [cId, c] of this.clients) {
          if (c.session?.user_id === p.user_id) {
            this.sendMessage(cId, notification);
            break;
          }
        }
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      this.sendError(clientId, 'Failed to delete group', message.request_id);
    }
  }

  private async handleLogout(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    try {
      // Delete the session from database
      const deleted = await userService.deleteSession(client.session.session_id);
      
      if (deleted) {
        // Clear session from client
        client.session = undefined;
        
        // Remove from user sessions map
        if (client.userId) {
          this.userSessions.delete(client.userId);
        }
        
        const response = {
          status: 'ok',
          type: 'logout',
          request_id: message.request_id,
          message: 'Logged out successfully'
        };

        this.sendMessage(clientId, response);
      } else {
        return this.sendError(clientId, 'Session not found', message.request_id);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      this.sendError(clientId, 'Failed to logout', message.request_id);
    }
  }

  getConnectedUsers(): Set<string> {
    return new Set(this.userSessions.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.userSessions.has(userId);
  }
}
