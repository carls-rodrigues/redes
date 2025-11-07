import { User, Session, Message } from '../types';
export declare class UserService {
    createUser(username: string, password: string): Promise<User>;
    getUserByUsername(username: string): Promise<User | undefined>;
    getUserById(id: string): Promise<User | undefined>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    createSession(userId: string, username: string): Promise<Session>;
    searchUsers(query: string, excludeUserId?: string): Promise<User[]>;
}
export declare class ChatService {
    getUserChats(userId: string): Promise<any[]>;
    private getChatParticipantsSync;
    getChat(chatId: string): Promise<any>;
    getChatParticipants(chatId: string): Promise<User[]>;
    createOrGetDM(userId1: string, userId2: string): Promise<string>;
    createGroup(groupName: string, creatorId: string, memberIds: string[]): Promise<any>;
    getGroup(groupId: string): Promise<any>;
    addGroupMember(groupId: string, userId: string): Promise<void>;
    removeGroupMember(groupId: string, userId: string): Promise<void>;
    listGroups(): Promise<any[]>;
}
export declare class MessageService {
    sendMessage(chatId: string, senderId: string, content: string): Promise<Message>;
    getMessages(chatId: string, limit?: number): Promise<Message[]>;
}
export declare const userService: UserService;
export declare const chatService: ChatService;
export declare const messageService: MessageService;
//# sourceMappingURL=index.d.ts.map