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
    } else if (message.type === 'group:name_updated') {
      this.handleGroupNameUpdated(message.payload);
    } else if (message.type === 'group:deleted') {
      this.handleGroupDeleted(message.payload);
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
        this.allUsers = response.users;  // Store all users for group settings
        this.populateMembersList(response.users);
        // If group settings modal is open, also load available members
        if (!document.getElementById('group-settings-modal').classList.contains('hidden')) {
          const isOwner = this.currentChat && this.currentChat.group_creator_id === this.currentUser.id;
          this.loadAvailableMembers(isOwner);
        }
        break;
      case 'create_group':
        this.loadChats();
        alert('Group created successfully!');
        break;
      case 'update_group_name':
        alert('Group name updated successfully!');
        this.loadChats();  // Refresh chat list
        break;
      case 'add_group_member':
        alert('Member added successfully!');
        this.loadChats();  // Refresh to see updated members
        break;
      case 'remove_group_member':
        alert('Member removed successfully!');
        this.loadChats();  // Refresh to see updated members
        break;
      case 'delete_group':
        alert('Group deleted successfully!');
        this.closeGroupSettings();
        this.currentChat = null;
        this.loadChats();  // Refresh chat list
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
    this.loadChats();  // Refresh chats to show member removal
  }

  handleGroupNameUpdated(data) {
    // Handle group name updated event
    if (this.currentChat && this.currentChat.group_id === data.group_id) {
      this.currentChat.group_name = data.new_name;
      document.getElementById('chat-title').textContent = data.new_name;
    }
    this.loadChats();  // Refresh chats to show name change
  }

  handleGroupDeleted(data) {
    // Handle group deleted event
    alert('This group has been deleted by the owner.');
    if (this.currentChat && this.currentChat.group_id === data.group_id) {
      this.currentChat = null;
      this.closeGroupSettings();
      document.getElementById('messages').innerHTML = '';
      document.getElementById('chat-area').classList.add('hidden');
      document.getElementById('welcome-screen').classList.remove('hidden');
    }
    this.loadChats();  // Refresh chats to remove deleted group
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
  }

  bindEvents() {
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

    // Group settings
    document.getElementById('group-settings-btn').addEventListener('click', () => this.openGroupSettings());
    document.getElementById('close-group-settings-btn').addEventListener('click', () => this.closeGroupSettings());
    document.getElementById('update-group-name-btn').addEventListener('click', () => this.updateGroupName());
    document.getElementById('add-members-btn').addEventListener('click', () => this.addMembersToGroup());
    document.getElementById('delete-group-btn').addEventListener('click', () => this.deleteGroup());

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
  }

  logout() {
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
  }

  renderChats() {
    const container = document.getElementById('conversations-list');
    container.innerHTML = '';

    if (this.chats.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-muted-foreground">No conversations yet</div>';
      return;
    }

    this.chats.forEach(chat => {
      const chatElement = document.createElement('div');
      const isSelected = this.currentChat && this.currentChat.id === chat.id;
      chatElement.className = `p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? '!bg-muted text-foreground' : 'text-foreground hover:bg-muted'}`;

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
        <p class="font-medium mb-1">${displayName}</p>
        <p class="text-sm truncate">${chat.last_message}</p>
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

    // Show/hide group settings button based on chat type
    const settingsBtn = document.getElementById('group-settings-btn');
    if (chat.type === 'group') {
      settingsBtn.classList.remove('hidden');
    } else {
      settingsBtn.classList.add('hidden');
    }

    // Update UI - hide welcome, show messages and input
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('messages').classList.remove('hidden');
    document.getElementById('message-input').classList.remove('hidden');

    // Refresh chat list to update selection styling
    this.renderChats();

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

  // Group Settings Methods
  openGroupSettings() {
    if (!this.currentChat || this.currentChat.type !== 'group') return;

    const modal = document.getElementById('group-settings-modal');
    modal.classList.remove('hidden');

    // Check if current user is group owner
    const isOwner = this.currentChat.group_creator_id === this.currentUser.id;

    // Load current group name
    document.getElementById('edit-group-name-input').value = this.currentChat.group_name || '';

    // Conditionally show/hide edit controls for non-owners
    const editGroupNameInput = document.getElementById('edit-group-name-input');
    const updateGroupNameBtn = document.getElementById('update-group-name-btn');
    editGroupNameInput.disabled = !isOwner;
    updateGroupNameBtn.disabled = !isOwner;
    updateGroupNameBtn.style.opacity = isOwner ? '1' : '0.5';
    updateGroupNameBtn.style.cursor = isOwner ? 'pointer' : 'not-allowed';

    // Disable delete button for non-owners
    const deleteGroupBtn = document.getElementById('delete-group-btn');
    deleteGroupBtn.disabled = !isOwner;
    deleteGroupBtn.style.opacity = isOwner ? '1' : '0.5';
    deleteGroupBtn.style.cursor = isOwner ? 'pointer' : 'not-allowed';

    // Load current members with ownership check
    this.loadGroupMembers(isOwner);

    // Load all users if not already loaded
    if (!this.allUsers) {
      this.sendWebSocketMessage({
        type: 'search_users',
        query: ''  // Empty query to get all users
      });
    } else {
      // If already loaded, just display available members
      this.loadAvailableMembers(isOwner);
    }
  }

  closeGroupSettings() {
    document.getElementById('group-settings-modal').classList.add('hidden');
  }

  loadGroupMembers(isOwner = false) {
    const membersList = document.getElementById('group-members-list');
    membersList.innerHTML = '';

    if (!this.currentChat || !this.currentChat.participants) return;

    this.currentChat.participants.forEach(member => {
      const memberElement = document.createElement('div');
      memberElement.className = 'flex items-center justify-between p-2 bg-muted/30 rounded border border-border';

      // Add owner indicator
      const isCreator = member.id === this.currentChat.group_creator_id;
      const creatorBadge = isCreator ? '<span class="text-xs bg-primary text-primary-foreground px-2 py-1 rounded ml-2">(Owner)</span>' : '';

      memberElement.innerHTML = `
        <span>${member.username}${creatorBadge}</span>
        <button class="px-2 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors remove-member-btn" data-user-id="${member.id}" ${!isOwner || isCreator ? 'disabled' : ''} style="opacity: ${(!isOwner || isCreator) ? '0.5' : '1'}; cursor: ${(!isOwner || isCreator) ? 'not-allowed' : 'pointer'};">
          Remove
        </button>
      `;

      // Add remove member event listener (only if enabled)
      const removeBtn = memberElement.querySelector('.remove-member-btn');
      if (!removeBtn.disabled) {
        removeBtn.addEventListener('click', (e) => {
          this.removeMemberFromGroup(member.id);
        });
      }

      membersList.appendChild(memberElement);
    });
  }

  loadAvailableMembers(isOwner = false) {
    const addMembersList = document.getElementById('add-members-list');
    addMembersList.innerHTML = '';

    if (!this.currentChat || !this.allUsers) return;

    // Only show add members section if user is owner
    if (!isOwner) {
      addMembersList.innerHTML = '<p class="text-sm text-muted-foreground p-2">Only the group owner can add members</p>';
      return;
    }

    // Get current member IDs
    const currentMemberIds = new Set(this.currentChat.participants.map(p => p.id));

    // Filter out current members
    const availableUsers = this.allUsers.filter(user => !currentMemberIds.has(user.id));

    if (availableUsers.length === 0) {
      addMembersList.innerHTML = '<p class="text-sm text-muted-foreground p-2">No users available to add</p>';
      return;
    }

    availableUsers.forEach(user => {
      const checkboxDiv = document.createElement('div');
      checkboxDiv.className = 'flex items-center p-2';
      checkboxDiv.innerHTML = `
        <input type="checkbox" id="add-member-${user.id}" value="${user.id}" class="mr-3 add-member-checkbox">
        <label for="add-member-${user.id}" class="cursor-pointer flex-1">${user.username}</label>
      `;
      addMembersList.appendChild(checkboxDiv);
    });
  }

  async updateGroupName() {
    if (!this.currentChat || this.currentChat.type !== 'group') return;

    const newName = document.getElementById('edit-group-name-input').value.trim();
    if (!newName) {
      alert('Please enter a group name');
      return;
    }

    this.sendWebSocketMessage({
      type: 'update_group_name',
      group_id: this.currentChat.group_id,
      new_name: newName
    });
  }

  async addMembersToGroup() {
    const checkboxes = document.querySelectorAll('#add-members-list input[type="checkbox"]:checked');
    const newMemberIds = Array.from(checkboxes).map(cb => cb.value);

    if (newMemberIds.length === 0) {
      alert('Please select at least one member to add');
      return;
    }

    // Add each member
    for (const userId of newMemberIds) {
      this.sendWebSocketMessage({
        type: 'add_group_member',
        group_id: this.currentChat.group_id,
        user_id: userId
      });
    }
  }

  async removeMemberFromGroup(userId) {
    if (!confirm('Remove this member from the group?')) return;

    this.sendWebSocketMessage({
      type: 'remove_group_member',
      group_id: this.currentChat.group_id,
      user_id: userId
    });
  }

  async deleteGroup() {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    this.sendWebSocketMessage({
      type: 'delete_group',
      group_id: this.currentChat.group_id
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});