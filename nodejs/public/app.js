// RedES Chat - Web Frontend with Tailwind CSS
class ChatApp {
  constructor() {
    this.currentUser = null;
    this.currentChat = null;
    this.chats = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuth();
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
    document.getElementById('new-chat-btn').addEventListener('click', () => this.createNewChat());
    document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());

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

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('session', JSON.stringify(result.session));
        this.showChat();
        this.loadChats();
      } else {
        this.showError('login-error', result.error);
      }
    } catch (error) {
      this.showError('login-error', 'Connection error');
    }
  }

  async register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (!username || !password) {
      this.showError('register-error', 'Please fill all fields');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        this.showSuccess('Account created! Please login.');
        this.switchTab('login');
      } else {
        this.showError('register-error', result.error);
      }
    } catch (error) {
      this.showError('register-error', 'Connection error');
    }
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
    try {
      const response = await fetch('/api/chats');
      const result = await response.json();

      if (result.success) {
        this.chats = result.chats;
        this.renderChats();
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
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
      chatElement.className = 'p-3 rounded-lg bg-card border cursor-pointer hover:bg-muted/50 transition-colors';
      if (this.currentChat && this.currentChat.id === chat.id) {
        chatElement.classList.add('bg-primary', 'text-primary-foreground');
      }

      chatElement.innerHTML = `
        <div class="font-medium mb-1">${chat.participants.map(p => p.username).join(', ')}</div>
        <div class="text-sm text-muted-foreground truncate">${chat.last_message}</div>
      `;

      chatElement.addEventListener('click', () => this.selectChat(chat));
      container.appendChild(chatElement);
    });
  }

  async selectChat(chat) {
    this.currentChat = chat;
    document.getElementById('chat-title').textContent = chat.participants.map(p => p.username).join(', ');

    // Update UI
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
    await this.loadMessages(chat.id);
  }

  async loadMessages(chatId) {
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      const result = await response.json();

      if (result.success) {
        this.renderMessages(result.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  renderMessages(messages) {
    const container = document.getElementById('messages');

    if (messages.length === 0) {
      container.innerHTML = '<div class="welcome-message text-center py-12"><div class="text-6xl mb-4">💬</div><h2 class="text-2xl font-bold mb-2">Start a conversation!</h2></div>';
      return;
    }

    container.innerHTML = '';
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

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: this.currentChat.id,
          content: content,
          senderId: this.currentUser.id
        })
      });

      const result = await response.json();

      if (result.success) {
        input.value = '';
        // Reload messages to show the new one
        await this.loadMessages(this.currentChat.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  createNewChat() {
    // For now, just show an alert
    alert('New chat feature coming soon! For now, chats are created automatically when you message someone.');
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

  clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});