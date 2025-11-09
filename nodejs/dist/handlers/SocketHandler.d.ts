import { Socket } from 'net';
import { SocketMessage } from '../types';
export declare class SocketHandler {
    private clients;
    private userSessions;
    private sendWebSocketMessage?;
    constructor();
    setSendWebSocketMessage(fn: (socket: Socket, data: any) => void): void;
    registerClient(clientId: string, socket: Socket): void;
    registerWebSocketClient(clientId: string, socket: Socket): void;
    unregisterClient(clientId: string): void;
    handleMessage(clientId: string, message: SocketMessage): Promise<void>;
    private handleAuth;
    private handleLogin;
    private handleRegister;
    private handleGetUserChats;
    private handleGetChat;
    private handleGetMessages;
    private handleSendMessage;
    private handleMarkRead;
    private handleSearchUsers;
    private handleCreateDM;
    private handleCreateGroup;
    private handleListGroups;
    private handleAddGroupMember;
    private handleRemoveGroupMember;
    private handleUpdateGroupName;
    private sendMessage;
    private sendError;
    private handleDeleteGroup;
    private handleLogout;
    getConnectedUsers(): Set<string>;
    isUserOnline(userId: string): boolean;
}
//# sourceMappingURL=SocketHandler.d.ts.map