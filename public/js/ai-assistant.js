// AI Assistant Module - Google Gemini Integration
const AIAssistant = {
    initialized: false,
    elements: {},
    state: {
        messages: [],
        conversationHistory: [],
        isOpen: false,
        isLoading: false,
        isAvailable: false
    },

    async init() {
        this.cacheDom();

        if (!this.elements.widget) {
            return;
        }

        if (!this.initialized) {
            this.bindEvents();
            this.initialized = true;
        }

        this.elements.widget.classList.add('ready');
        
        // ✅ Wait for auth to be ready before making API calls
        if (window.waitForAuthReady) {
            const authReady = await window.waitForAuthReady(3000);
            if (!authReady) {
                // Check if user is actually authenticated (might be a timing issue)
                if (window.isAuthenticated && window.currentSession && window.currentSession.access_token) {
                    console.log('[AUTH] AI Assistant: Auth not ready but session exists, retrying waitForReady...');
                    // Retry with longer timeout
                    const retryReady = await window.waitForAuthReady(2000);
                    if (retryReady) {
                        console.log('[AUTH] AI Assistant: Auth ready after retry, proceeding with availability check');
                        // Continue to checkAvailability() below
                    } else {
                        console.log('[AUTH] AI Assistant: Auth still not ready after retry, but session exists - proceeding anyway');
                        // Session exists, proceed anyway to checkAvailability() below
                    }
                } else {
                    console.log('[AUTH] AI Assistant: Auth not ready yet, setting up listener');
                    this.setStatus('Silakan login untuk menggunakan AI', 'info');
                    
                    // Listen for authentication state changes
                    if (window.authStateManager) {
                        window.authStateManager.addListener((state) => {
                            if (state.isAuthenticated) {
                                console.log('[AUTH] AI Assistant: User authenticated, checking availability...');
                                this.checkAvailability().catch(err => {
                                    console.warn('[AUTH] AI Assistant: Availability check failed after login:', err);
                                });
                            }
                        });
                    }
                    return;
                }
            }
        } else if (!window.isAuthenticated) {
            // Fallback if waitForAuthReady is not available
            console.log('[AUTH] AI Assistant: User not authenticated yet, skipping availability check');
            this.setStatus('Silakan login untuk menggunakan AI', 'info');
            
            // Listen for authentication state changes
            if (window.authStateManager) {
                window.authStateManager.addListener((state) => {
                    if (state.isAuthenticated) {
                        console.log('[AUTH] AI Assistant: User authenticated, checking availability...');
                        this.checkAvailability().catch(err => {
                            console.warn('[AUTH] AI Assistant: Availability check failed after login:', err);
                        });
                    }
                });
            }
            return;
        }
        
        // Auth is ready, check availability
        try {
            await this.checkAvailability();
        } catch (error) {
            console.warn('[AUTH] AI Assistant: Availability check failed:', error);
            this.setStatus('Layanan AI belum tersedia', 'warning');
        }
    },

    cacheDom() {
        this.elements = {
            widget: document.getElementById('ai-assistant-widget'),
            toggle: document.getElementById('ai-assistant-toggle'),
            panel: document.getElementById('ai-assistant-panel'),
            closeBtn: document.querySelector('#ai-assistant-panel .ai-close'),
            messages: document.getElementById('ai-messages'),
            input: document.getElementById('ai-input'),
            sendBtn: document.getElementById('ai-send-btn'),
            status: document.getElementById('ai-status')
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

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.state.isOpen) {
                this.togglePanel(false);
            }
        });
    },

    async checkAvailability() {
        try {
            // ✅ Wait for auth to be ready before making API call
            if (window.waitForAuthReady) {
                const authReady = await window.waitForAuthReady(3000);
                if (!authReady) {
                    // Check if user is actually authenticated (might be a timing issue)
                    if (window.isAuthenticated && window.currentSession && window.currentSession.access_token) {
                        console.log('[AUTH] AI Assistant: Auth not ready but session exists, retrying waitForReady...');
                        // Retry with longer timeout
                        const retryReady = await window.waitForAuthReady(2000);
                        if (retryReady) {
                            console.log('[AUTH] AI Assistant: Auth ready after retry, proceeding with availability check');
                            // Continue to availability check below
                        } else {
                            console.log('[AUTH] AI Assistant: Auth still not ready after retry, but session exists - proceeding anyway');
                            // Session exists, proceed anyway to availability check below
                        }
                    } else {
                        console.log('[AUTH] AI Assistant: Skipping availability check - auth not ready');
                        this.state.isAvailable = false;
                        this.setStatus('Silakan login untuk menggunakan AI', 'info');
                        return;
                    }
                }
            } else if (!window.isAuthenticated) {
                console.log('[AUTH] AI Assistant: Skipping availability check - user not authenticated');
                this.state.isAvailable = false;
                this.setStatus('Silakan login untuk menggunakan AI', 'info');
                return;
            }

            // ✅ Use apiService instead of direct apiCall (waitForAuthReady already called in apiCall)
            const api = window.apiService?.apiCall || window.apiCall;
            if (typeof api !== 'function') {
                throw new Error('API service tidak tersedia');
            }

            const response = await api('/api/ai-assistant/status');
            this.state.isAvailable = response?.available || false;
            
            if (!this.state.isAvailable) {
                this.setStatus('Layanan AI belum tersedia', 'warning');
            } else {
                this.setStatus('');
            }
        } catch (error) {
            // Don't log as error if it's just authentication issue
            const isAuthError = error.message && (
                error.message.includes('login') || 
                error.message.includes('401') || 
                error.message.includes('403') ||
                error.message.includes('Sesi Anda telah berakhir') ||
                error.message.includes('harus login')
            );
            
            if (isAuthError) {
                console.log('[AUTH] AI Assistant: Availability check skipped - authentication required');
            } else {
                console.error('[AUTH] AI Assistant: Availability check error:', error);
            }
            
            this.state.isAvailable = false;
            
            if (error.message && error.message.includes('sedang memuat')) {
                this.setStatus('Aplikasi sedang memuat...', 'warning');
            } else if (isAuthError) {
                this.setStatus('Silakan login untuk menggunakan AI', 'info');
            } else {
                this.setStatus('Tidak dapat memeriksa ketersediaan AI', 'warning');
            }
        }
    },

    togglePanel(forceState) {
        const shouldOpen = forceState !== undefined ? forceState : !this.state.isOpen;
        this.state.isOpen = shouldOpen;

        if (this.elements.panel) {
            if (shouldOpen) {
                this.elements.panel.classList.add('open');
                this.elements.panel.setAttribute('aria-hidden', 'false');
                this.elements.input?.focus();
            } else {
                this.elements.panel.classList.remove('open');
                this.elements.panel.setAttribute('aria-hidden', 'true');
            }
        }

        if (this.elements.toggle) {
            this.elements.toggle.setAttribute('aria-expanded', shouldOpen.toString());
        }
    },

    async handleSend() {
        const input = this.elements.input;
        if (!input) return;

        const message = input.value.trim();
        if (!message || this.state.isLoading) return;

        // Add user message to UI
        this.addMessage('user', message);
        input.value = '';

        // Add to conversation history
        this.state.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Show loading state
        this.setLoading(true);
        this.setStatus('AI sedang memproses...', 'loading');

        try {
            // Check if apiCall function is available
            const api = window.apiService?.apiCall || window.apiCall;
            if (typeof api !== 'function') {
                throw new Error('API function tidak tersedia. Silakan refresh halaman.');
            }

            const response = await api('/api/ai-assistant/chat', {
                method: 'POST',
                body: {
                    message: message,
                    conversationHistory: this.state.conversationHistory
                }
            });

            if (response && response.success && response.message) {
                // Add AI response to UI
                this.addMessage('assistant', response.message);

                // Add to conversation history
                this.state.conversationHistory.push({
                    role: 'assistant',
                    content: response.message
                });

                // Keep only last 10 messages in history
                if (this.state.conversationHistory.length > 10) {
                    this.state.conversationHistory = this.state.conversationHistory.slice(-10);
                }

                this.setStatus('');
            } else {
                const errorMsg = response?.error || 'Tidak ada respons dari AI';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('AI chat error:', error);
            
            let userMessage = 'Maaf, terjadi kesalahan saat memproses permintaan Anda.';
            
            if (error.message.includes('500')) {
                userMessage = 'Terjadi kesalahan server. Silakan coba lagi dalam beberapa saat.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                userMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
            } else if (error.message.includes('API function')) {
                userMessage = error.message;
            } else {
                userMessage = `Kesalahan: ${error.message}`;
            }
            
            this.addMessage('assistant', userMessage);
            this.setStatus('Gagal mengirim pesan', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    addMessage(role, content) {
        if (!this.elements.messages) return;

        // Remove empty state if exists
        const emptyState = this.elements.messages.querySelector('.ai-empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const messageId = `ai-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ai-message-${role}`;
        messageEl.id = messageId;

        const timestamp = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (role === 'user') {
            messageEl.innerHTML = `
                <div class="ai-message-content">
                    <div class="ai-message-text">${this.escapeHtml(content)}</div>
                    <div class="ai-message-time">${timestamp}</div>
                </div>
                <div class="ai-message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="ai-message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="ai-message-content">
                    <div class="ai-message-header">
                        <span class="ai-message-name">AI Assistant</span>
                        <span class="ai-message-time">${timestamp}</span>
                    </div>
                    <div class="ai-message-text">${this.formatAIResponse(content)}</div>
                </div>
            `;
        }

        this.elements.messages.appendChild(messageEl);
        this.scrollToBottom();

        // Add to state
        this.state.messages.push({
            id: messageId,
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
    },

    formatAIResponse(text) {
        // Convert markdown-like formatting to HTML
        let formatted = this.escapeHtml(text);
        
        // Bold text (**text**)
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text (*text*)
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Numbered lists
        formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        
        // Bullet points
        formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
        
        // Wrap lists in ul tags
        formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    scrollToBottom() {
        if (this.elements.messages) {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }
    },

    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        if (this.elements.sendBtn) {
            this.elements.sendBtn.disabled = isLoading;
            this.elements.sendBtn.innerHTML = isLoading 
                ? '<i class="fas fa-spinner fa-spin"></i>' 
                : '<i class="fas fa-paper-plane"></i>';
        }
        if (this.elements.input) {
            this.elements.input.disabled = isLoading;
        }
    },

    setStatus(message, type = '') {
        if (!this.elements.status) return;
        
        if (!message) {
            this.elements.status.textContent = '';
            this.elements.status.className = 'ai-status';
            return;
        }

        this.elements.status.textContent = message;
        this.elements.status.className = `ai-status ai-status-${type}`;
        
        if (type === 'error' || type === 'warning') {
            setTimeout(() => {
                if (this.elements.status.textContent === message) {
                    this.setStatus('');
                }
            }, 5000);
        }
    },

    clearMessages() {
        if (this.elements.messages) {
            this.elements.messages.innerHTML = `
                <div class="ai-empty-state">
                    <i class="fas fa-robot"></i>
                    <p>Mulai percakapan dengan AI Assistant untuk bantuan manajemen risiko.</p>
                    <p class="ai-empty-hint">Coba tanyakan: "Bagaimana cara mengidentifikasi risiko di unit IGD?"</p>
                </div>
            `;
        }
        this.state.messages = [];
        this.state.conversationHistory = [];
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIAssistant.init());
} else {
    AIAssistant.init();
}

// Export for global access
window.AIAssistant = AIAssistant;

