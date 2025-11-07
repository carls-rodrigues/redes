// RedES Chat - Web Frontend with WebSockets
class ChatApp {
  constructor() {
    this.currentUser = null;
    this.currentChat = null;
    this.chats = [];
    this.ws = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuth();
    this.connectWebSocket();
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate if we have a session
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      if (session.session_id) {
        this.authenticate(session.session_id);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Try to reconnect after 5 seconds
      setTimeout(() => this.connectWebSocket(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  authenticate(token) {
    this.sendWebSocketMessage({
      type: 'auth',
      token: token
    });
  }

  sendWebSocketMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      message.request_id = ++this.requestId;
      this.pendingRequests.set(message.request_id, message);
      this.ws.send(JSON.stringify(message));
    }
  }

  handleWebSocketMessage(message) {
    // Handle responses to requests
    if (message.request_id && this.pendingRequests.has(message.request_id)) {
      const originalRequest = this.pendingRequests.get(message.request_id);
      this.pendingRequests.delete(message.request_id);

      if (message.status === 'ok') {
        this.handleSuccessResponse(originalRequest, message);
      } else if (message.status === 'error') {
        this.handleErrorResponse(originalRequest, message);
      }
    }

    // Handle real-time events
    if (message.type === 'message:new') {
      this.handleNewMessage(message.payload);
    } else if (message.type === 'group:created') {
      this.handleGroupCreated(message.payload);
    } else if (message.type === 'group:member_added') {
      this.handleGroupMemberAdded(message.payload);
    } else if (message.type === 'group:member_removed') {
      this.handleGroupMemberRemoved(message.payload);
    }
  }

  handleSuccessResponse(request, response) {
    switch (request.type) {
      case 'auth':
        // WebSocket authentication successful
        this.currentUser = response.user;
        this.loadChats();
        break;
      case 'login':
        this.currentUser = response.user;
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('session', JSON.stringify(response.session));
        this.showChat();
        this.loadChats();
        break;
      case 'register':
        this.showSuccess('Account created! Please login.');
        this.switchTab('login');
        break;
      case 'get_user_chats':
        this.chats = response.chats;
        this.renderChats();
        break;
      case 'get_messages':
        this.renderMessages(response.messages);
        break;
      case 'message':
        // Message sent successfully
        break;
      case 'search_users':
        this.populateMembersList(response.users);
        break;
      case 'create_group':
        this.loadChats();
        alert('Group created successfully!');
        break;
    }
  }

  handleErrorResponse(request, response) {
    switch (request.type) {
      case 'login':
        this.showError('login-error', response.message);
        break;
      case 'register':
        this.showError('register-error', response.message);
        break;
      default:
        console.error('Request error:', response.message);
    }
  }

  handleNewMessage(message) {
    // If we're viewing the chat where this message was sent, add it to the UI
    if (this.currentChat && this.currentChat.id === message.chat_session_id) {
      this.addMessageToUI(message);
    }
    // Update chat list to show new message
    this.loadChats();
  }

  handleGroupCreated(group) {
    this.loadChats();
  }

  handleGroupMemberAdded(data) {
    // Handle group member added event
  }

  handleGroupMemberRemoved(data) {
    // Handle group member removed event
  }

  addMessageToUI(message) {
    const container = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'flex mb-4';

    if (message.sender_id === this.currentUser.id) {
      messageElement.classList.add('justify-end');
      messageElement.innerHTML = `
                <div class="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
                    <div class="text-sm font-medium mb-1">${message.sender_username}</div>
                    <div class="text-sm">${message.content}</div>
                    <div class="text-xs opacity-70 mt-1">${new Date(message.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
    } else {
      messageElement.classList.add('justify-start');
      messageElement.innerHTML = `
                <div class="bg-muted px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
                    <div class="text-sm font-medium mb-1">${message.sender_username}</div>
                    <div class="text-sm">${message.content}</div>
                    <div class="text-xs text-muted-foreground mt-1">${new Date(message.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
    }

    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
  } bindEvents() {
    // Auth tabs
    document.getElementById('login-tab').addEventListener('click', () => this.switchTab('login'));
    document.getElementById('register-tab').addEventListener('click', () => this.switchTab('register'));

    // Auth forms
    document.getElementById('login-btn').addEventListener('click', () => this.login());
    document.getElementById('register-btn').addEventListener('click', () => this.register());

    // Chat
    document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    document.getElementById('new-chat-btn').addEventListener('click', () => this.openGroupModal());
    document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());

    // Group modal
    document.getElementById('cancel-group-btn').addEventListener('click', () => this.closeGroupModal());
    document.getElementById('create-group-btn').addEventListener('click', () => this.submitCreateGroup());

    // Enter key in message input
    document.getElementById('message-text').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(btn => {
      btn.classList.remove('border-primary', 'text-primary');
      btn.classList.add('border-transparent', 'text-muted-foreground');
    });
    document.getElementById(tab + '-tab').classList.remove('border-transparent', 'text-muted-foreground');
    document.getElementById(tab + '-tab').classList.add('border-primary', 'text-primary');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
    document.getElementById(tab + '-form').classList.remove('hidden');

    // Clear errors
    this.clearErrors();
  }

  async login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      this.showError('login-error', 'Please fill all fields');
      return;
    }

    this.sendWebSocketMessage({
      type: 'login',
      username: username,
      password: password
    });
  }

  async register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (!username || !password) {
      this.showError('register-error', 'Please fill all fields');
      return;
    }

    this.sendWebSocketMessage({
      type: 'register',
      username: username,
      password: password
    });
  } logout() {
    this.currentUser = null;
    this.currentChat = null;
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    this.showAuth();
  }

  checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.showChat();
      this.loadChats();
    } else {
      this.showAuth();
    }
  }

  showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
  }

  showChat() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('current-user').textContent = this.currentUser.username;
  }

  async loadChats() {
    this.sendWebSocketMessage({
      type: 'get_user_chats'
    });
  } renderChats() {
    const container = document.getElementById('conversations-list');
    container.innerHTML = '';

    if (this.chats.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-muted-foreground">No conversations yet</div>';
      return;
    }

    this.chats.forEach(chat => {
      const chatElement = document.createElement('div');
      chatElement.className = 'p-3 rounded-lg bg-card border cursor-pointer hover:bg-muted/50 transition-colors';
      if (this.currentChat && this.currentChat.id === chat.id) {
        chatElement.classList.add('bg-primary', 'text-primary-foreground');
      }

      // Determine display name: group name for groups, other person for DMs
      let displayName;
      // For DM, show the other person's name (not current user)
      if (chat.type === 'dm') {
        displayName = chat.participants
          .filter(p => p.id !== this.currentUser.id)
          .map(p => p.username)
          .join(', ') || chat.participants.map(p => p.username).join(', ');
      } else {
        // For groups, show the group name or "Unnamed Group"
        displayName = chat.group_name || 'Unnamed Group';
      }

      chatElement.innerHTML = `
        <div class="font-medium mb-1">${displayName}</div>
        <div class="text-sm text-muted-foreground truncate">${chat.last_message}</div>
      `;

      chatElement.addEventListener('click', () => this.selectChat(chat));
      container.appendChild(chatElement);
    });
  }

  async selectChat(chat) {
    this.currentChat = chat;

    // Determine display name: group name for groups, other person for DMs
    let displayName;
    // For DM, show the other person's name (not current user)
    if (chat.type === 'dm') {
      displayName = chat.participants
        .filter(p => p.id !== this.currentUser.id)
        .map(p => p.username)
        .join(', ') || chat.participants.map(p => p.username).join(', ');
    } else {
      // For groups, show the group name or "Unnamed Group"
      displayName = chat.group_name || 'Unnamed Group';
    }

    document.getElementById('chat-title').textContent = displayName;

    // Update UI - hide welcome, show messages and input
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('messages').classList.remove('hidden');
    document.getElementById('message-input').classList.remove('hidden');

    // Update conversation selection
    document.querySelectorAll('#conversations-list > div').forEach(item => {
      item.classList.remove('bg-primary', 'text-primary-foreground');
      item.classList.add('bg-card', 'text-card-foreground');
    });
    event.target.closest('div').classList.remove('bg-card', 'text-card-foreground');
    event.target.closest('div').classList.add('bg-primary', 'text-primary-foreground');

    // Enable message input
    document.getElementById('message-text').disabled = false;
    document.getElementById('send-btn').disabled = false;

    // Load messages
    this.loadMessages(chat.id);
  }

  async loadMessages(chatId) {
    this.sendWebSocketMessage({
      type: 'get_messages',
      chat_id: chatId
    });
  }

  renderMessages(messages) {
    const container = document.getElementById('messages');

    container.innerHTML = '';

    if (messages.length === 0) {
      container.innerHTML = '<div class="text-center py-12 text-muted-foreground"><p>No messages yet. Start the conversation!</p></div>';
      return;
    }

    messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'flex mb-4';

      if (message.sender_id === this.currentUser.id) {
        messageElement.classList.add('justify-end');
        messageElement.innerHTML = `
          <div class="bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
            <div class="text-sm font-medium mb-1">${message.sender_username}</div>
            <div class="text-sm">${message.content}</div>
            <div class="text-xs opacity-70 mt-1">${new Date(message.timestamp).toLocaleTimeString()}</div>
          </div>
        `;
      } else {
        messageElement.classList.add('justify-start');
        messageElement.innerHTML = `
          <div class="bg-muted px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
            <div class="text-sm font-medium mb-1">${message.sender_username}</div>
            <div class="text-sm">${message.content}</div>
            <div class="text-xs text-muted-foreground mt-1">${new Date(message.timestamp).toLocaleTimeString()}</div>
          </div>
        `;
      }

      container.appendChild(messageElement);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  async sendMessage() {
    const input = document.getElementById('message-text');
    const content = input.value.trim();

    if (!content || !this.currentChat) return;

    this.sendWebSocketMessage({
      type: 'message',
      chat_id: this.currentChat.id,
      content: content
    });

    input.value = '';
  }

  checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.showChat();
      // Chats will be loaded after WebSocket authentication
    } else {
      this.showAuth();
    }
  }

  logout() {
    this.currentUser = null;
    this.currentChat = null;
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    this.showAuth();
    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
    }
  }

  async loadChats() {
    this.sendWebSocketMessage({
      type: 'get_user_chats'
    });
  } showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
  }

  showChat() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('current-user').textContent = this.currentUser.username;
  }

  createNewChat() {
    this.openGroupModal();
  }

  async openGroupModal() {
    document.getElementById('create-group-modal').classList.remove('hidden');
    // Load all users to display as members (after modal is visible)
    await new Promise(resolve => setTimeout(resolve, 100));
    this.sendWebSocketMessage({
      type: 'search_users',
      query: ''  // Empty query to get all users
    });
  }

  closeGroupModal() {
    document.getElementById('create-group-modal').classList.add('hidden');
    document.getElementById('group-name-input').value = '';
    document.getElementById('members-list').innerHTML = '';
  }

  async submitCreateGroup() {
    const groupName = document.getElementById('group-name-input').value.trim();
    const checkboxes = document.querySelectorAll('#members-list input[type="checkbox"]:checked');
    const memberIds = Array.from(checkboxes).map(cb => cb.value);  // Keep as strings (UUIDs)

    if (!groupName) {
      alert('Please enter a group name');
      return;
    }

    if (memberIds.length === 0) {
      alert('Please select at least one member');
      return;
    }

    this.sendWebSocketMessage({
      type: 'create_group',
      group_name: groupName,
      member_ids: memberIds
    });

    this.closeGroupModal();
  }

  showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.remove('hidden');
  }

  showSuccess(message) {
    // For now, just alert
    alert(message);
  }

  populateMembersList(users) {
    const membersList = document.getElementById('members-list');
    membersList.innerHTML = '';

    // Filter out current user
    const otherUsers = users.filter(user => user.id !== this.currentUser.id);

    otherUsers.forEach(user => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors';
      label.innerHTML = `
        <input type="checkbox" value="${user.id}" class="w-4 h-4 rounded border-input">
        <span class="flex-1">${user.username}</span>
      `;
      membersList.appendChild(label);
    });
  }

  clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});