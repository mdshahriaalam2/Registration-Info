class ChatManager {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendMessage');
        this.uploadModal = document.getElementById('uploadModal');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.uploadPreview = document.getElementById('uploadPreview');
        this.profileModal = document.getElementById('profileModal');
        this.openProfileBtn = document.getElementById('openProfileBtn');
        this.editProfileBtn = document.getElementById('editProfileBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.aiChatToggle = document.getElementById('aiChatToggle');
        this.currentAgent = null;
        this.isAIChat = false;
        this.aiTyping = false;
        this.user = null;

        // Initialize event listeners
        this.initializeEventListeners();
        
        // Check authentication
        this.checkAuth();
    }

    initializeEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Send message on Enter (but allow Shift+Enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // File upload handling
        document.querySelector('.action-btn[title="Attach File"]').addEventListener('click', () => this.openUploadModal());
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.closest('.modal')));
        });
        document.querySelector('.modal .btn-secondary[data-dismiss="modal"]').addEventListener('click', () => this.closeModal(this.uploadModal));
        this.uploadBtn.addEventListener('click', () => this.handleFileUpload());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Chat actions
        document.querySelector('.action-btn[title="Clear Chat"]').addEventListener('click', () => this.clearChat());
        document.querySelector('.action-btn[title="Download Chat"]').addEventListener('click', () => this.downloadChat());

        // Agent selection
        document.querySelectorAll('.agent').forEach(agent => {
            agent.addEventListener('click', () => this.switchAgent(agent));
        });

        // Profile handling
        this.openProfileBtn.addEventListener('click', () => this.openProfileModal());
        this.editProfileBtn.addEventListener('click', () => this.editProfile());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // AI Chat toggle
        this.aiChatToggle.addEventListener('change', (e) => {
            this.isAIChat = e.target.checked;
            this.handleAIChatToggle();
        });

        // Mobile menu
        document.querySelector('.mobile-menu-btn').addEventListener('click', () => this.toggleMobileMenu());
    }

    checkAuth() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }
        this.user = user;
        this.updateUserInfo();
    }

    updateUserInfo() {
        // Update sidebar user info
        document.getElementById('userName').textContent = `${this.user.firstName} ${this.user.lastName}`;
        document.getElementById('userEmail').textContent = this.user.email;

        // Update profile modal info
        document.getElementById('profileFullName').textContent = `${this.user.firstName} ${this.user.lastName}`;
        document.getElementById('profileEmail').textContent = this.user.email;
        document.getElementById('profileEducation').textContent = this.user.educationLevel || 'Not specified';
        document.getElementById('profileCollege').textContent = this.user.college || 'Not specified';
        document.getElementById('profileMobile').textContent = this.user.mobile || 'Not specified';
    }

    openProfileModal() {
        this.profileModal.style.display = 'flex';
    }

    closeModal(modal) {
        modal.style.display = 'none';
        if (modal === this.uploadModal) {
            this.uploadPreview.innerHTML = '';
            this.fileInput.value = '';
        }
    }

    editProfile() {
        // TODO: Implement profile editing functionality
        alert('Profile editing will be implemented soon!');
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.chat-sidebar');
        sidebar.classList.toggle('active');
    }

    async handleAIChatToggle() {
        if (this.isAIChat) {
            // Switch to AI chat
            this.currentAgent = 'AI Assistant';
            this.addSystemMessage('Switched to AI Assistant. How can I help you today?');
            // Update UI to show AI is active
            document.querySelector('.current-agent').innerHTML = `
                <div class="agent-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="agent-info">
                    <h4>AI Assistant</h4>
                    <p>Powered by OpenAI</p>
                </div>
            `;
        } else {
            // Switch back to human support
            this.currentAgent = 'John Doe';
            this.addSystemMessage('Switched to human support. A support agent will be with you shortly.');
            // Update UI to show human agent is active
            document.querySelector('.current-agent').innerHTML = `
                <div class="agent-avatar">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="agent-info">
                    <h4>John Doe</h4>
                    <p>Technical Support</p>
                </div>
            `;
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage('user', message);
        this.messageInput.value = '';

        if (this.isAIChat) {
            // Show AI typing indicator
            this.showTypingIndicator();
            try {
                // TODO: Replace with actual OpenAI API call
                // const response = await this.getAIResponse(message);
                // Simulate AI response for now
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.hideTypingIndicator();
                this.addMessage('ai', 'This is a simulated AI response. The actual OpenAI integration will be implemented when the API key is provided.');
            } catch (error) {
                this.hideTypingIndicator();
                this.addSystemMessage('Sorry, there was an error processing your request. Please try again.');
                console.error('AI Chat Error:', error);
            }
        } else {
            // Simulate human agent response
            setTimeout(() => {
                this.addMessage('agent', 'Thank you for your message. A support agent will respond shortly.');
            }, 1000);
        }
    }

    async getAIResponse(message) {
        // TODO: Implement OpenAI API call
        // This will be implemented when the API key is provided
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('AI response placeholder');
            }, 1000);
        });
    }

    showTypingIndicator() {
        this.aiTyping = true;
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai typing';
        typingIndicator.innerHTML = `
            <div class="agent-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingIndicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.aiTyping = false;
        const typingIndicator = this.chatMessages.querySelector('.typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        let avatar = '';
        if (type === 'agent' || type === 'ai') {
            avatar = `
                <div class="agent-avatar">
                    <i class="fas fa-${type === 'ai' ? 'robot' : 'user-tie'}"></i>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content">
                <p>${this.formatMessage(content)}</p>
            </div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
            </div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    switchAgent(agentElement) {
        // Remove active class from all agents
        document.querySelectorAll('.agent').forEach(agent => agent.classList.remove('active'));
        // Add active class to selected agent
        agentElement.classList.add('active');
        // Update current agent info
        const agentName = agentElement.querySelector('h4').textContent;
        const agentRole = agentElement.querySelector('p').textContent;
        this.currentAgent = agentName;
        this.addSystemMessage(`Connected with ${agentName} (${agentRole})`);
    }

    openUploadModal() {
        this.uploadModal.style.display = 'flex';
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.uploadPreview.innerHTML = `
                <div class="file-preview">
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                    <small>${this.formatFileSize(file.size)}</small>
                </div>
            `;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleFileUpload() {
        const file = this.fileInput.files[0];
        if (!file) {
            this.addSystemMessage('Please select a file to upload.');
            return;
        }

        // TODO: Implement actual file upload
        // For now, just simulate upload
        this.addSystemMessage(`File "${file.name}" uploaded successfully.`);
        this.closeModal(this.uploadModal);
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            // Keep only the welcome message
            const welcomeMessage = this.chatMessages.querySelector('.message.system');
            this.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage);
            }
        }
    }

    downloadChat() {
        const messages = Array.from(this.chatMessages.querySelectorAll('.message'))
            .map(msg => {
                const type = msg.classList.contains('user') ? 'You' :
                           msg.classList.contains('agent') ? 'Support' :
                           msg.classList.contains('ai') ? 'AI Assistant' : 'System';
                const content = msg.querySelector('.message-content p').textContent;
                const time = msg.querySelector('.message-time').textContent;
                return `[${time}] ${type}: ${content}`;
            })
            .join('\n');

        const blob = new Blob([messages], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
}); 