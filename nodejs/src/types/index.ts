export interface User {
  id: string;
  username: string;
  password?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  type: 'dm' | 'group';
  group_id?: string;
  created_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_session_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_username?: string;
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  name: string;
  last_message: string;
  last_message_time?: string;
  last_sender?: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  username: string;
  created_at: string;
}

export interface SocketMessage {
  type: string;
  session?: Session;
  chat_id?: string;
  content?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}
