import { Socket } from 'net';
import { SocketMessage } from '../types';
export declare class SocketHandler {
    private clients;
    private userSessions;
    constructor();
    registerClient(clientId: string, socket: Socket): void;
    unregisterClient(clientId: string): void;
    handleMessage(clientId: string, message: SocketMessage): Promise<void>;
    private handleAuth;
    private handleLogin;
    private handleRegister;
    private handleGetUserChats;
    private handleGetChat;
    private handleGetMessages;
    private handleSendMessage;
    private handleSearchUsers;
    private handleCreateDM;
    private sendMessage;
    private sendError;
    getConnectedUsers(): Set<string>;
    isUserOnline(userId: string): boolean;
}
//# sourceMappingURL=SocketHandler.d.ts.map