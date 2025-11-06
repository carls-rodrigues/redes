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
    console.log(`[handleMessage] Received: ${message.type}`, message);
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      switch (message.type) {
        case 'login':
          console.log(`[handleMessage] Switch: calling handleLogin`);
          await this.handleLogin(clientId, message);
          console.log(`[handleMessage] Switch: handleLogin completed`);
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
    } catch (error) {
      this.sendError(clientId, 'Internal server error');
      console.error('Error handling message:', error);
    }
  }

  private async handleLogin(clientId: string, message: SocketMessage) {
    console.log(`[handleLogin] Called for client: ${clientId}, username: ${message.username}`);
    try {
      const { username, password } = message;
      console.log(`[handleLogin] Got credentials - username: ${username}, password: ${password ? 'yes' : 'no'}`);
      if (!username || !password) {
        console.log(`[handleLogin] Missing credentials`);
        return this.sendError(clientId, 'Username and password required');
      }

      console.log(`[handleLogin] Looking up user: ${username}`);
      const user = await userService.getUserByUsername(username);
      console.log(`[handleLogin] User found: ${!!user}, id: ${user?.id}`);
      if (!user) {
        console.log(`[handleLogin] User not found`);
        return this.sendError(clientId, 'Invalid credentials');
      }

      console.log(`[handleLogin] Verifying password`);
      const isValid = await userService.verifyPassword(password, user.password!);
      console.log(`[handleLogin] Password valid: ${isValid}`);
      if (!isValid) {
        console.log(`[handleLogin] Password invalid`);
        return this.sendError(clientId, 'Invalid credentials');
      }

      console.log(`[handleLogin] Creating session for user: ${user.id}`);
      const session = await userService.createSession(user.id, username);
      console.log(`[handleLogin] Session created:`, session);
      const client = this.clients.get(clientId);
      console.log(`[handleLogin] Client object found:`, !!client);
      if (client) {
        client.userId = user.id;
        client.session = session;
        this.userSessions.set(user.id, clientId);
        console.log(`[handleLogin] Client authenticated successfully, userId: ${user.id}, clientId: ${clientId}`);
        console.log(`[handleLogin] userSessions now has ${this.userSessions.size} entries`);

        this.sendMessage(clientId, {
          status: 'ok',
          user_id: user.id,
          username: user.username,
          session_id: session.session_id
        });
      }
    } catch (error) {
      console.error(`[handleLogin] Error:`, error);
      this.sendError(clientId, 'Login failed');
    }
  }

  private async handleRegister(clientId: string, message: SocketMessage) {
    const { username, password } = message;
    if (!username || !password) {
      return this.sendError(clientId, 'Username and password required');
    }

    try {
      const user = await userService.createUser(username, password);
      const session = await userService.createSession(user.id, username);
      
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
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return this.sendError(clientId, 'Username already exists');
      }
      throw error;
    }
  }

  private async handleGetUserChats(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated');
    }

    const chats = await chatService.getUserChats(client.session.user_id);
    this.sendMessage(clientId, {
      status: 'ok',
      chats
    });
  }

  private async handleGetMessages(clientId: string, message: SocketMessage) {
    const client = this.clients.get(clientId);
    if (!client?.session) {
      return this.sendError(clientId, 'Not authenticated');
    }

    const { chat_id } = message;
    if (!chat_id) {
      return this.sendError(clientId, 'chat_id required');
    }

    const messages = await messageService.getMessages(chat_id);
    this.sendMessage(clientId, {
      status: 'ok',
      messages
    });
  }

  private async handleSendMessage(clientId: string, message: SocketMessage) {
    console.log(`[handleSendMessage] Called for client: ${clientId}`);
    const client = this.clients.get(clientId);
    console.log(`[handleSendMessage] Client found: ${!!client}, authenticated: ${!!client?.session}`);
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
    console.log(`Broadcasting message to ${participants.length} participants. Sender: ${client.session.user_id}`);
    for (const participant of participants) {
      console.log(`Checking participant: ${participant.id} vs sender: ${client.session.user_id}`);
      if (participant.id !== client.session.user_id) {
        const receiverClientId = this.userSessions.get(participant.id);
        console.log(`Found receiver client ID: ${receiverClientId}`);
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

  private sendMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client) {
      const json = JSON.stringify(data);
      client.socket.write(json);
    }
  }

  private sendError(clientId: string, error: string) {
    this.sendMessage(clientId, { status: 'error', message: error });
  }

  getConnectedUsers(): Set<string> {
    return new Set(this.userSessions.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.userSessions.has(userId);
  }
}
