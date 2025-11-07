import { Socket } from 'net';
import { userService, chatService, messageService } from '../services';
import { SocketMessage, Session } from '../types';

interface ClientInfo {
  userId?: string;
  socket: Socket;
  session?: Session;
}

export class SocketHandler {
  private clients: Map<string, ClientInfo> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> clientId

  constructor() {}

  registerClient(clientId: string, socket: Socket) {
    this.clients.set(clientId, { socket });
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
      }
    } catch (error) {
      this.sendError(clientId, 'Internal server error', message.request_id);
      console.error('Error handling message:', error);
    }
  }

  private async handleAuth(clientId: string, message: SocketMessage) {
    try {
      const { userId } = message;
      if (!userId) {
        return this.sendError(clientId, 'userId required', message.request_id);
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        return this.sendError(clientId, 'User not found', message.request_id);
      }

      const client = this.clients.get(clientId);
      if (client) {
        client.userId = userId;
        // Create a new session for this socket connection
        const session = await userService.createSession(userId, user.username);
        client.session = session;
        this.userSessions.set(userId, clientId);

        const response: any = {
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
          user_id: user.id,
          username: user.username,
          session_id: session.session_id
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
      return this.sendError(clientId, 'Not authenticated');
    }

    const { chat_id, content } = message;
    if (!chat_id || !content) {
      return this.sendError(clientId, 'chat_id and content required');
    }

    const msg = await messageService.sendMessage(chat_id, client.session.user_id, content);

    // Send confirmation to sender
    this.sendMessage(clientId, {
      status: 'ok',
      message_id: msg.id,
      timestamp: msg.timestamp
    });

    // Broadcast to other participants
    const participants = await chatService.getChatParticipants(chat_id);
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

  private async handleSearchUsers(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated', message.request_id);
    }

    const { query } = message;
    if (!query || typeof query !== 'string') {
      return this.sendError(clientId, 'query required', message.request_id);
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

    const response: any = {
      status: 'ok',
      chat_id: chatId,
      chat
    };
    if (message.request_id) {
      response.request_id = message.request_id;
    }
    this.sendMessage(clientId, response);
  }

  private sendMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.socket.writable) {
      const json = JSON.stringify(data) + '\n';
      client.socket.write(json, (err) => {
        if (err && (err as any).code !== 'EPIPE') {
          console.error('Write error:', err);
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

  getConnectedUsers(): Set<string> {
    return new Set(this.userSessions.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.userSessions.has(userId);
  }
}
