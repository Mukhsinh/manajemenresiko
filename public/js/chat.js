const ChatWidget = {
    initialized: false,
    elements: {},
    state: {
        organizationId: null,
        organizations: [],
        members: [],
        messages: [],
        messageIds: new Set(),
        unreadCount: 0,
        isOpen: false,
        isLoading: false,
        userId: null,
        channel: null
    },

    init() {
        this.cacheDom();

        if (!this.elements.widget) {
            return;
        }

        if (!this.initialized) {
            this.bindEvents();
            this.initialized = true;
        }

        this.elements.widget.classList.add('ready');
        this.bootstrap();
    },

    destroy() {
        this.leaveRealtimeChannel();
        this.state.organizationId = null;
        this.state.organizations = [];
        this.state.members = [];
        this.state.messages = [];
        this.state.messageIds = new Set();
        this.state.unreadCount = 0;
        this.state.isOpen = false;
        this.state.userId = null;
        this.state.isLoading = false;
        this.memberDirectory = {};
        if (this.elements.widget) {
            this.elements.widget.classList.remove('ready');
        }
        if (this.elements.panel) {
            this.elements.panel.classList.remove('open');
            this.elements.panel.setAttribute('aria-hidden', 'true');
        }
        if (this.elements.toggle) {
            this.elements.toggle.setAttribute('aria-expanded', 'false');
        }
        if (this.elements.unread) {
            this.elements.unread.setAttribute('hidden', '');
            this.elements.unread.textContent = '0';
        }
        if (this.elements.messages) {
            this.elements.messages.innerHTML = '';
        }
        if (this.elements.input) {
            this.elements.input.value = '';
        }
        this.setStatus('');
    },

    cacheDom() {
        this.elements = {
            widget: document.getElementById('chat-widget'),
            toggle: document.getElementById('chat-toggle'),
            panel: document.getElementById('chat-panel'),
            closeBtn: document.querySelector('#chat-panel .chat-close'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-input'),
            sendBtn: document.getElementById('chat-send-btn'),
            orgSelect: document.getElementById('chat-org-select'),
            activeOrg: document.getElementById('chat-active-org'),
            unread: document.getElementById('chat-unread'),
            status: document.getElementById('chat-status')
        };
    },

    bindEvents() {
        this.elements.toggle?.addEventListener('click', () => this.togglePanel());
        this.elements.closeBtn?.addEventListener('click', () => this.togglePanel(false));

        this.elements.sendBtn?.addEventListener('click', () => this.handleSend());
        this.elements.input?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.handleSend();
            }
        });

        this.elements.orgSelect?.addEventListener('change', (event) => {
            const newOrgId = event.target.value;
            if (newOrgId && newOrgId !== this.state.organizationId) {
                this.leaveRealtimeChannel();
                this.loadMessages(newOrgId);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.state.isOpen) {
                this.togglePanel(false);
            }
        });
    },

    async bootstrap() {
        await this.resolveUser();
        await this.loadMessages();
    },

    async resolveUser() {
        try {
            const supabaseClient = window.supabaseClient || window.supabase;
            if (!supabaseClient) return;
            const { data } = await supabaseClient.auth.getUser();
            this.state.userId = data?.user?.id || null;
        } catch (error) {
            console.error('Chat resolve user error:', error);
        }
    },

    async loadMessages(organizationId) {
        if (this.state.isLoading) {
            return;
        }
        this.state.isLoading = true;
        this.setStatus('Memuat percakapan...', 'loading');
        try {
            const query = organizationId ? `?organizationId=${organizationId}` : '';
            const response = await apiCall(`/api/chat/messages${query}`);
            this.state.organizationId = response.organizationId;
            this.state.organizations = response.organizations || [];
            this.state.members = response.members || [];
            this.state.messages = response.messages || [];
            this.state.messageIds = new Set(this.state.messages.map((msg) => msg.id));

            this.indexMembers();
            this.renderOrganizations();
            this.renderMessages();
            this.joinRealtimeChannel();
            this.setStatus('');
            this.elements.widget?.classList.add('ready');
        } catch (error) {
            console.error('Chat load error:', error);
            this.setStatus(error.message || 'Gagal memuat chat.', 'error');
        } finally {
            this.state.isLoading = false;
        }
    },

    indexMembers() {
        this.memberDirectory = this.memberDirectory || {};
        this.state.members.forEach((member) => {
            if (member.user_id) {
                this.memberDirectory[member.user_id] = member.full_name;
            }
        });
        this.state.messages.forEach((message) => {
            if (message.user_id && message.full_name) {
                this.memberDirectory[message.user_id] = message.full_name;
            }
        });
    },

    renderOrganizations() {
        if (!this.elements.orgSelect) return;
        const options = this.state.organizations
            .map(
                (org) => `
                <option value="${org.id}" ${org.id === this.state.organizationId ? 'selected' : ''}>
                    ${org.name}
                </option>`
            )
            .join('');
        this.elements.orgSelect.innerHTML = options;
        this.elements.orgSelect.disabled = this.state.organizations.length <= 1;

        const activeOrg = this.state.organizations.find((org) => org.id === this.state.organizationId);
        if (activeOrg && this.elements.activeOrg) {
            this.elements.activeOrg.textContent = activeOrg.name;
        }
    },

    renderMessages() {
        if (!this.elements.messages) return;
        if (!this.state.messages.length) {
            this.elements.messages.innerHTML = `
                <div class="chat-empty-state">
                    <i class="fas fa-comments"></i>
                    <p>Belum ada pesan. Jadilah yang pertama untuk menyapa!</p>
                </div>`;
            return;
        }

        this.elements.messages.innerHTML = this.state.messages
            .map((message) => this.renderMessageTemplate(message))
            .join('');
        this.scrollToBottom();
    },

    renderMessageTemplate(message) {
        const isSelf = message.user_id === this.state.userId;
        const displayName = this.resolveDisplayName(message);
        const messageText = this.escapeHTML(message.message).replace(/\n/g, '<br>');
        return `
            <div class="chat-message ${isSelf ? 'self' : ''}">
                <div class="chat-message-meta">
                    <span>${isSelf ? 'Anda' : displayName}</span>
                    <span>${this.formatTime(message.created_at)}</span>
                </div>
                <div class="chat-message-content">${messageText}</div>
            </div>
        `;
    },

    resolveDisplayName(message) {
        if (!message.user_id) return 'Rekan Organisasi';
        if (message.user_id === this.state.userId) return 'Anda';
        if (message.full_name) return message.full_name;
        if (this.memberDirectory?.[message.user_id]) {
            return this.memberDirectory[message.user_id];
        }
        return 'Rekan Organisasi';
    },

    togglePanel(forceOpen) {
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !this.state.isOpen;
        this.state.isOpen = shouldOpen;

        if (this.elements.panel) {
            this.elements.panel.classList.toggle('open', shouldOpen);
            this.elements.panel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        }

        if (this.elements.toggle) {
            this.elements.toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        }

        if (shouldOpen) {
            this.resetUnread();
            setTimeout(() => this.scrollToBottom(), 150);
        }
    },

    async handleSend() {
        if (!this.state.organizationId || !this.elements.input) return;
        const message = this.elements.input.value.trim();
        if (!message) return;

        this.elements.sendBtn.disabled = true;
        try {
            const payload = await apiCall('/api/chat/messages', {
                method: 'POST',
                body: {
                    organizationId: this.state.organizationId,
                    message
                }
            });
            this.elements.input.value = '';
            this.appendMessage(payload);
            this.setStatus('Pesan terkirim.', 'success');
            setTimeout(() => this.setStatus(''), 2000);
        } catch (error) {
            console.error('Chat send error:', error);
            this.setStatus(error.message || 'Gagal mengirim pesan.', 'error');
        } finally {
            this.elements.sendBtn.disabled = false;
        }
    },

    appendMessage(message, options = {}) {
        if (!message || this.state.messageIds.has(message.id)) {
            return;
        }

        this.state.messageIds.add(message.id);
        this.state.messages.push(message);
        if (message.user_id && message.full_name) {
            this.memberDirectory = this.memberDirectory || {};
            this.memberDirectory[message.user_id] = message.full_name;
        }
        this.renderMessages();

        if (!this.state.isOpen && options.isRealtime) {
            this.incrementUnread();
        }
    },

    joinRealtimeChannel() {
        const supabaseClient = window.supabaseClient || window.supabase;
        if (!supabaseClient || !this.state.organizationId) return;

        this.leaveRealtimeChannel();

        this.state.channel = supabaseClient
            .channel(`org-chat-${this.state.organizationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'organization_chat_messages',
                    filter: `organization_id=eq.${this.state.organizationId}`
                },
                (payload) => {
                    if (payload.new) {
                        const incoming = {
                            id: payload.new.id,
                            organization_id: payload.new.organization_id,
                            message: payload.new.message,
                            created_at: payload.new.created_at,
                            user_id: payload.new.user_id,
                            full_name:
                                this.memberDirectory?.[payload.new.user_id] ||
                                (payload.new.user_id === this.state.userId ? 'Anda' : 'Rekan Organisasi')
                        };
                        this.appendMessage(incoming, { isRealtime: true });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    this.setStatus('');
                }
            });
    },

    leaveRealtimeChannel() {
        const supabaseClient = window.supabaseClient || window.supabase;
        if (this.state.channel && supabaseClient?.removeChannel) {
            supabaseClient.removeChannel(this.state.channel);
        }
        this.state.channel = null;
    },

    incrementUnread() {
        this.state.unreadCount += 1;
        if (this.elements.unread) {
            this.elements.unread.textContent = `${this.state.unreadCount}`;
            this.elements.unread.removeAttribute('hidden');
        }
    },

    resetUnread() {
        this.state.unreadCount = 0;
        if (this.elements.unread) {
            this.elements.unread.textContent = '0';
            this.elements.unread.setAttribute('hidden', '');
        }
    },

    scrollToBottom() {
        if (!this.elements.messages) return;
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    },

    escapeHTML(text = '') {
        return text.replace(/[&<>'"]/g, (char) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return map[char] || char;
        });
    },

    formatTime(timestamp) {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            return new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return '';
        }
    },

    setStatus(message, variant) {
        if (!this.elements.status) return;
        this.elements.status.textContent = message || '';
        this.elements.status.classList.remove('error', 'success');
        if (variant === 'error') {
            this.elements.status.classList.add('error');
        } else if (variant === 'success') {
            this.elements.status.classList.add('success');
        }
    }
};

window.chatWidget = ChatWidget;

