/**
 * RouterManager - Singleton class for managing router lifecycle
 * Handles dependency checking, retry logic, and initialization state
 */
class RouterManager {
    constructor() {
        if (RouterManager.instance) {
            return RouterManager.instance;
        }
        
        this.state = {
            status: 'pending', // 'pending' | 'initializing' | 'ready' | 'failed'
            instance: null,
            initializationTime: null,
            retryCount: 0,
            lastError: null,
            fallbackActive: false
        };
        
        this.config = {
            maxRetries: 10,
            retryDelay: 500,
            timeout: 2000,
            dependencies: ['SPARouter', 'AuthGuard', 'ROUTE_CONFIG'],
            fallbackEnabled: true
        };
        
        this.callbacks = {
            onReady: [],
            onError: [],
            onFallback: []
        };
        
        // Initialize error handler
        this.errorHandler = new (window.RouterErrorHandler || class {
            handleDependencyError() { return { message: 'Error handler not available' }; }
            handleTimeoutError() { return { message: 'Error handler not available' }; }
            handleConfigurationError() { return { message: 'Error handler not available' }; }
            handleRuntimeError() { return { message: 'Error handler not available' }; }
            logPerformanceMetric() {}
        })();
        
        RouterManager.instance = this;
        console.log('🏗️ RouterManager singleton created');
    }
    
    /**
     * Get singleton instance
     * @returns {RouterManager}
     */
    static getInstance() {
        if (!RouterManager.instance) {
            RouterManager.instance = new RouterManager();
        }
        return RouterManager.instance;
    }
    
    /**
     * Initialize router with dependency checking and retry logic
     * @returns {Promise<boolean>}
     */
    async initialize() {
        if (this.state.status === 'ready') {
            console.log('✅ Router already initialized, skipping');
            return true;
        }
        
        if (this.state.status === 'initializing') {
            console.log('⏳ Router initialization already in progress');
            return new Promise((resolve) => {
                this.onReady(() => resolve(true));
                this.onError(() => resolve(false));
            });
        }
        
        // Check for persisted state to prevent unnecessary re-initialization
        const persistedState = this._loadPersistedState();
        if (persistedState && this._isValidPersistedState(persistedState)) {
            console.log('🔄 Found valid persisted router state, attempting to restore...');
            
            // Try to restore from persisted state
            if (await this._restoreFromPersistedState(persistedState)) {
                return true;
            } else {
                console.log('⚠️ Failed to restore from persisted state, proceeding with fresh initialization');
                this._clearPersistedState();
            }
        }
        
        console.log('🚀 Starting router initialization...');
        this.state.status = 'initializing';
        this.state.initializationTime = Date.now();
        
        try {
            const success = await this._initializeWithRetry();
            if (success) {
                this.state.status = 'ready';
                this.state.initializationTime = Date.now() - this.state.initializationTime;
                console.log(`✅ Router initialized successfully in ${this.state.initializationTime}ms`);
                
                // Persist successful state
                this._persistState();
                
                this._notifyCallbacks('onReady');
                return true;
            } else {
                this.state.status = 'failed';
                console.error('❌ Router initialization failed after all retries');
                this._activateFallback();
                this._notifyCallbacks('onError');
                return false;
            }
        } catch (error) {
            this.state.status = 'failed';
            this.state.lastError = error;
            console.error('❌ Router initialization error:', error);
            this._activateFallback();
            this._notifyCallbacks('onError');
            return false;
        }
    }
    
    /**
     * Initialize with retry logic
     * @private
     * @returns {Promise<boolean>}
     */
    async _initializeWithRetry() {
        const startTime = Date.now();
        
        while (this.state.retryCount < this.config.maxRetries) {
            try {
                // Check for timeout
                const elapsed = Date.now() - startTime;
                if (elapsed > this.config.timeout) {
                    const timeoutError = this.errorHandler.handleTimeoutError(elapsed, this.config.timeout);
                    this.state.lastError = timeoutError;
                    throw new Error(timeoutError.message);
                }
                
                // Check dependencies
                const missingDeps = this._checkDependencies();
                if (missingDeps.length > 0) {
                    const depError = this.errorHandler.handleDependencyError(
                        missingDeps, 
                        this.state.retryCount, 
                        this.config.maxRetries
                    );
                    
                    if (this.state.retryCount < this.config.maxRetries - 1) {
                        this.state.retryCount++;
                        await this._delay(this.config.retryDelay * this.state.retryCount); // Exponential backoff
                        continue;
                    } else {
                        this.state.lastError = depError;
                        throw new Error(depError.message);
                    }
                }
                
                // All dependencies available, create router
                const router = await this._createRouter();
                if (router) {
                    this.state.instance = router;
                    window.appRouter = router;
                    
                    // Log performance metric
                    const totalTime = Date.now() - startTime;
                    this.errorHandler.logPerformanceMetric('router_initialization', totalTime, true);
                    
                    return true;
                }
                
                throw new Error('Failed to create router instance');
                
            } catch (error) {
                const runtimeError = this.errorHandler.handleRuntimeError(error, 'initialization');
                this.state.lastError = runtimeError;
                
                console.warn(`⚠️ Router initialization attempt ${this.state.retryCount + 1} failed:`, error.message);
                
                if (this.state.retryCount < this.config.maxRetries - 1) {
                    this.state.retryCount++;
                    await this._delay(this.config.retryDelay * this.state.retryCount);
                } else {
                    // Log failed performance metric
                    const totalTime = Date.now() - startTime;
                    this.errorHandler.logPerformanceMetric('router_initialization', totalTime, false);
                    throw error;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if all dependencies are available
     * @private
     * @returns {string[]} Array of missing dependencies
     */
    _checkDependencies() {
        const missing = [];
        
        for (const dep of this.config.dependencies) {
            if (typeof window[dep] === 'undefined') {
                missing.push(dep);
            }
        }
        
        return missing;
    }
    
    /**
     * Create router instance
     * @private
     * @returns {Promise<SPARouter|null>}
     */
    async _createRouter() {
        try {
            console.log('🔧 Creating router instance...');
            
            // Validate configuration
            if (!window.ROUTE_CONFIG || typeof window.ROUTE_CONFIG !== 'object') {
                const configError = this.errorHandler.handleConfigurationError(
                    new Error('Invalid ROUTE_CONFIG'), 
                    window.ROUTE_CONFIG
                );
                throw new Error(configError.message);
            }
            
            // Create auth guard with enhanced authentication check
            const authGuard = new window.AuthGuard({
                isAuthenticated: () => {
                    // Use authService if available
                    if (window.authService && typeof window.authService.isAuthenticated === 'function') {
                        return window.authService.isAuthenticated();
                    }
                    
                    // Fallback checks
                    const hasCurrentUser = !!(window.currentUser);
                    const hasCurrentSession = !!(window.currentSession && window.currentSession.access_token);
                    const isAuthenticatedFlag = !!(window.isAuthenticated);
                    
                    return hasCurrentUser || hasCurrentSession || isAuthenticatedFlag;
                }
            });
            
            // Create router instance
            const router = new window.SPARouter(window.ROUTE_CONFIG, {
                authGuard: authGuard,
                fallbackRoute: '/404'
            });
            
            console.log(`✅ Router created with ${Object.keys(window.ROUTE_CONFIG).length} routes`);
            return router;
            
        } catch (error) {
            const runtimeError = this.errorHandler.handleRuntimeError(error, 'router_creation');
            console.error('❌ Error creating router:', runtimeError.message);
            throw error;
        }
    }
    
    /**
     * Activate fallback navigation system
     * @private
     */
    _activateFallback() {
        if (!this.config.fallbackEnabled) {
            return;
        }
        
        console.log('🔄 Activating fallback navigation system...');
        this.state.fallbackActive = true;
        
        // Ensure legacy navigation functions are available
        if (typeof window.originalNavigateToPage === 'function') {
            window.navigateToPage = window.originalNavigateToPage;
            console.log('✅ Legacy navigation restored');
        } else {
            console.warn('⚠️ Legacy navigation not available');
        }
        
        this._notifyCallbacks('onFallback');
    }
    
    /**
     * Delay helper function
     * @private
     * @param {number} ms
     * @returns {Promise<void>}
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Notify callbacks
     * @private
     * @param {string} type
     */
    _notifyCallbacks(type) {
        const callbacks = this.callbacks[type] || [];
        callbacks.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error(`Error in ${type} callback:`, error);
            }
        });
    }
    
    /**
     * Register callback for when router is ready
     * @param {Function} callback
     */
    onReady(callback) {
        if (this.state.status === 'ready') {
            callback(this.state);
        } else {
            this.callbacks.onReady.push(callback);
        }
    }
    
    /**
     * Register callback for when router initialization fails
     * @param {Function} callback
     */
    onError(callback) {
        if (this.state.status === 'failed') {
            callback(this.state);
        } else {
            this.callbacks.onError.push(callback);
        }
    }
    
    /**
     * Register callback for when fallback is activated
     * @param {Function} callback
     */
    onFallback(callback) {
        if (this.state.fallbackActive) {
            callback(this.state);
        } else {
            this.callbacks.onFallback.push(callback);
        }
    }
    
    /**
     * Check if router is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.state.status === 'ready';
    }
    
    /**
     * Get current router instance
     * @returns {SPARouter|null}
     */
    getRouter() {
        return this.state.instance;
    }
    
    /**
     * Get current state
     * @returns {Object}
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Get error statistics and performance metrics
     * @returns {Object}
     */
    getErrorStatistics() {
        return this.errorHandler.getErrorStatistics();
    }
    
    /**
     * Get last error details
     * @returns {Object|null}
     */
    getLastError() {
        return this.state.lastError;
    }
    
    /**
     * Destroy router and clean up
     */
    destroy() {
        console.log('🗑️ Destroying RouterManager...');
        
        if (this.state.instance && typeof this.state.instance.destroy === 'function') {
            this.state.instance.destroy();
        }
        
        // Clear persisted state
        this._clearPersistedState();
        
        this.state = {
            status: 'pending',
            instance: null,
            initializationTime: null,
            retryCount: 0,
            lastError: null,
            fallbackActive: false
        };
        
        this.callbacks = {
            onReady: [],
            onError: [],
            onFallback: []
        };
        
        window.appRouter = null;
        RouterManager.instance = null;
        
        console.log('✅ RouterManager destroyed');
    }
    
    /**
     * Persist current state to sessionStorage
     * @private
     */
    _persistState() {
        try {
            const stateToSave = {
                status: this.state.status,
                initializationTime: this.state.initializationTime,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            sessionStorage.setItem('routerManagerState', JSON.stringify(stateToSave));
            console.log('💾 Router state persisted');
        } catch (error) {
            console.warn('⚠️ Failed to persist router state:', error);
        }
    }
    
    /**
     * Load persisted state from sessionStorage
     * @private
     * @returns {Object|null}
     */
    _loadPersistedState() {
        try {
            const stateJson = sessionStorage.getItem('routerManagerState');
            if (stateJson) {
                return JSON.parse(stateJson);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load persisted router state:', error);
        }
        return null;
    }
    
    /**
     * Check if persisted state is valid and recent
     * @private
     * @param {Object} persistedState
     * @returns {boolean}
     */
    _isValidPersistedState(persistedState) {
        if (!persistedState || typeof persistedState !== 'object') {
            return false;
        }
        
        // Check required fields
        if (!persistedState.status || !persistedState.timestamp) {
            return false;
        }
        
        // Check if state is recent (within 5 minutes)
        const fiveMinutes = 5 * 60 * 1000;
        const isRecent = Date.now() - persistedState.timestamp < fiveMinutes;
        
        // Check if it's the same session (same URL and user agent)
        const sameUrl = persistedState.url === window.location.href;
        const sameUserAgent = persistedState.userAgent === navigator.userAgent;
        
        // Only consider valid if it was a successful initialization
        const wasSuccessful = persistedState.status === 'ready';
        
        return isRecent && sameUrl && sameUserAgent && wasSuccessful;
    }
    
    /**
     * Restore router from persisted state
     * @private
     * @param {Object} persistedState
     * @returns {Promise<boolean>}
     */
    async _restoreFromPersistedState(persistedState) {
        try {
            // Check if dependencies are still available
            const missingDeps = this._checkDependencies();
            if (missingDeps.length > 0) {
                console.log(`⚠️ Cannot restore: missing dependencies ${missingDeps.join(', ')}`);
                return false;
            }
            
            // Try to create router instance
            const router = await this._createRouter();
            if (!router) {
                console.log('⚠️ Cannot restore: failed to create router instance');
                return false;
            }
            
            // Restore state
            this.state.status = 'ready';
            this.state.instance = router;
            this.state.initializationTime = persistedState.initializationTime || 0;
            window.appRouter = router;
            
            console.log('✅ Router state restored from persistence');
            this._notifyCallbacks('onReady');
            return true;
            
        } catch (error) {
            console.warn('⚠️ Failed to restore router from persisted state:', error);
            return false;
        }
    }
    
    /**
     * Clear persisted state
     * @private
     */
    _clearPersistedState() {
        try {
            sessionStorage.removeItem('routerManagerState');
        } catch (error) {
            console.warn('⚠️ Failed to clear persisted router state:', error);
        }
    }
}

// Make available globally
window.RouterManager = RouterManager;

console.log('📦 RouterManager class loaded');