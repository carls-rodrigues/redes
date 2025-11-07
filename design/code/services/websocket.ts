import { io, Socket } from 'socket.io-client'

interface PendingRequest {
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

class WebSocketClient {
  private socket: Socket | null = null
  private pendingRequests: Map<string, PendingRequest> = new Map()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000

  constructor() {
    this.connect()
  }

  connect(host = process.env.NEXT_PUBLIC_SERVER_HOST || 'localhost', port = process.env.NEXT_PUBLIC_SERVER_PORT || '5000') {
    const serverUrl = `http://${host}:${port}`

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    })

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected to server')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from server')
      this.isConnected = false
      this.attemptReconnect()
    })

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error)
      this.attemptReconnect()
    })

    // Handle responses to requests
    this.socket.on('response', (data: any) => {
      const { request_id, ...response } = data
      if (request_id && this.pendingRequests.has(request_id)) {
        const { resolve } = this.pendingRequests.get(request_id)!
        resolve(response)
        this.pendingRequests.delete(request_id)
      }
    })

    // Handle error responses
    this.socket.on('error', (data: any) => {
      const { request_id, message } = data
      if (request_id && this.pendingRequests.has(request_id)) {
        const { reject } = this.pendingRequests.get(request_id)!
        reject(new Error(message))
        this.pendingRequests.delete(request_id)
      }
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[WebSocket] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay)
    }
  }

  private sendRequest(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected to server'))
        return
      }

      const requestId = `req_${Date.now()}_${Math.random()}`
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error('Request timeout'))
      }, 10000) // 10 second timeout

      this.pendingRequests.set(requestId, { resolve, reject, timeout })

      this.socket.emit(type, { ...data, request_id: requestId })
    })
  }

  // Auth methods
  async login(username: string, password: string) {
    const result = await this.sendRequest('login', { username, password })
    return result
  }

  async register(username: string, password: string) {
    const result = await this.sendRequest('register', { username, password })
    return result
  }

  async logout() {
    const result = await this.sendRequest('logout', {})
    return result
  }

  // Chat methods
  async getUserChats(userId: string) {
    const result = await this.sendRequest('get_user_chats', { user_id: userId })
    return result
  }

  async getChat(chatId: string) {
    const result = await this.sendRequest('get_chat', { chat_id: chatId })
    return result
  }

  async createDM(userId1: string, userId2: string) {
    const result = await this.sendRequest('create_dm', { user_id_1: userId1, user_id_2: userId2 })
    return result
  }

  async getChatParticipants(chatId: string) {
    const result = await this.sendRequest('get_chat_participants', { chat_id: chatId })
    return result
  }

  async searchUsers(query: string, excludeUserId: string) {
    const result = await this.sendRequest('search_users', { query, exclude_user_id: excludeUserId })
    return result
  }

  // Group methods
  async createGroup(groupName: string, memberIds: string[]) {
    const result = await this.sendRequest('create_group', { group_name: groupName, member_ids: memberIds })
    return result
  }

  async listGroups() {
    const result = await this.sendRequest('list_groups', {})
    return result
  }

  async addGroupMember(groupId: string, userId: string) {
    const result = await this.sendRequest('add_group_member', { group_id: groupId, user_id: userId })
    return result
  }

  async removeGroupMember(groupId: string, userId: string) {
    const result = await this.sendRequest('remove_group_member', { group_id: groupId, user_id: userId })
    return result
  }

  // Message methods
  async sendMessage(chatId: string, content: string, senderUsername: string) {
    const result = await this.sendRequest('send_message', { chat_id: chatId, content, sender_username: senderUsername })
    return result
  }

  async getMessages(chatId: string, limit?: number) {
    const result = await this.sendRequest('get_messages', { chat_id: chatId, limit })
    return result
  }

  // Event listeners (similar to Electron IPC)
  onMessageReceived(callback: (message: any) => void) {
    this.socket?.on('message_received', callback)
  }

  onUserOnline(callback: (userId: string) => void) {
    this.socket?.on('user_online', callback)
  }

  onUserOffline(callback: (userId: string) => void) {
    this.socket?.on('user_offline', callback)
  }

  onChatUpdated(callback: (chat: any) => void) {
    this.socket?.on('chat_updated', callback)
  }

  onGroupCreated(callback: (group: any) => void) {
    this.socket?.on('group_created', callback)
  }

  onGroupMemberAdded(callback: (data: any) => void) {
    this.socket?.on('group_member_added', callback)
  }

  onGroupMemberRemoved(callback: (data: any) => void) {
    this.socket?.on('group_member_removed', callback)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected
  }
}

// Create singleton instance
const websocketClient = new WebSocketClient()

export default websocketClient