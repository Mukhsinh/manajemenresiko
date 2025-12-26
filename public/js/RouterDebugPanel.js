/**
 * RouterDebugPanel - Debugging and monitoring tools for router system
 * Provides real-time status, metrics, and health checks
 */
class RouterDebugPanel {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
        this.panel = null;
        
        // Initialize panel if in development mode
        if (this._isDevelopmentMode()) {
            this._createPanel();
            this._setupKeyboardShortcut();
        }
    }
    
    /**
     * Check if we're in development mode
     * @private
     * @returns {boolean}
     */
    _isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=true');
    }
    
    /**
     * Create the debug panel UI
     * @private
     */
    _createPanel() {
        // Create panel container
        this.panel = document.createElement('div');
        this.panel.id = 'router-debug-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            display: none;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
        `;
        
        // Add panel to document
        document.body.appendChild(this.panel);
        
        console.log('🔧 Router debug panel created (Press Ctrl+Shift+R to toggle)');
    }
    
    /**
     * Setup keyboard shortcut to toggle panel
     * @private
     */
    _setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+R to toggle panel
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    /**
     * Toggle panel visibility
     */
    toggle() {
        if (!this.panel) return;
        
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this._startUpdating();
            console.log('🔧 Router debug panel opened');
        } else {
            this._stopUpdating();
            console.log('🔧 Router debug panel closed');
        }
    }
    
    /**
     * Show the panel
     */
    show() {
        if (!this.isVisible) {
            this.toggle();
        }
    }
    
    /**
     * Hide the panel
     */
    hide() {
        if (this.isVisible) {
            this.toggle();
        }
    }
    
    /**
     * Start updating panel content
     * @private
     */
    _startUpdating() {
        this._updateContent();
        this.updateInterval = setInterval(() => {
            this._updateContent();
        }, 1000);
    }
    
    /**
     * Stop updating panel content
     * @private
     */
    _stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Update panel content
     * @private
     */
    _updateContent() {
        if (!this.panel || !this.isVisible) return;
        
        const routerManager = window.RouterManager ? window.RouterManager.getInstance() : null;
        const router = window.appRouter;
        
        const content = `
            <div style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #4CAF50;">🔧 Router Debug Panel</h3>
                <small style="color: #888;">Press Ctrl+Shift+R to toggle</small>
            </div>
            
            ${this._renderRouterStatus(routerManager, router)}
            ${this._renderErrorStatistics(routerManager)}
            ${this._renderPerformanceMetrics(routerManager)}
            ${this._renderHealthChecks(routerManager, router)}
            ${this._renderRouteInformation(router)}
            ${this._renderActions()}
        `;
        
        this.panel.innerHTML = content;
        this._attachEventListeners();
    }
    
    /**
     * Render router status section
     * @private
     */
    _renderRouterStatus(routerManager, router) {
        const status = routerManager ? routerManager.getState() : { status: 'unknown' };
        const statusColor = this._getStatusColor(status.status);
        
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 5px 0; color: #2196F3;">📊 Router Status</h4>
                <div style="margin-left: 10px;">
                    <div>Status: <span style="color: ${statusColor}; font-weight: bold;">${status.status}</span></div>
                    <div>Router Instance: ${router ? '✅ Available' : '❌ Not Available'}</div>
                    <div>Manager Instance: ${routerManager ? '✅ Available' : '❌ Not Available'}</div>
                    <div>Initialization Time: ${status.initializationTime || 'N/A'}ms</div>
                    <div>Retry Count: ${status.retryCount || 0}</div>
                    <div>Fallback Active: ${status.fallbackActive ? '⚠️ Yes' : '✅ No'}</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render error statistics section
     * @private
     */
    _renderErrorStatistics(routerManager) {
        const stats = routerManager ? routerManager.getErrorStatistics() : null;
        
        if (!stats) {
            return `
                <div style="margin-bottom: 15px;">
                    <h4 style="margin: 5px 0; color: #FF9800;">⚠️ Error Statistics</h4>
                    <div style="margin-left: 10px; color: #888;">No error handler available</div>
                </div>
            `;
        }
        
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 5px 0; color: #FF9800;">⚠️ Error Statistics (Last Hour)</h4>
                <div style="margin-left: 10px;">
                    <div>Total Errors: <span style="color: ${stats.totalErrors > 0 ? '#f44336' : '#4CAF50'}">${stats.totalErrors}</span></div>
                    <div>Total Warnings: <span style="color: ${stats.totalWarnings > 0 ? '#FF9800' : '#4CAF50'}">${stats.totalWarnings}</span></div>
                    ${this._renderErrorsByCategory(stats.errorsByCategory)}
                    ${stats.lastError ? `<div style="margin-top: 5px; color: #f44336;">Last Error: ${stats.lastError.message}</div>` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render errors by category
     * @private
     */
    _renderErrorsByCategory(errorsByCategory) {
        if (!errorsByCategory || Object.keys(errorsByCategory).length === 0) {
            return '<div>No errors by category</div>';
        }
        
        const categories = Object.entries(errorsByCategory)
            .map(([category, count]) => `${category}: ${count}`)
            .join(', ');
            
        return `<div>By Category: ${categories}</div>`;
    }
    
    /**
     * Render performance metrics section
     * @private
     */
    _renderPerformanceMetrics(routerManager) {
        const stats = routerManager ? routerManager.getErrorStatistics() : null;
        const performance = stats ? stats.performance : {};
        
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 5px 0; color: #9C27B0;">📈 Performance Metrics</h4>
                <div style="margin-left: 10px;">
                    ${Object.keys(performance).length > 0 ? 
                        Object.entries(performance).map(([operation, metrics]) => `
                            <div style="margin-bottom: 5px;">
                                <strong>${operation}:</strong><br>
                                <span style="margin-left: 10px;">
                                    Count: ${metrics.count}, 
                                    Success Rate: ${metrics.successRate.toFixed(1)}%, 
                                    Avg: ${metrics.averageDuration.toFixed(1)}ms
                                </span>
                            </div>
                        `).join('') : 
                        '<div style="color: #888;">No performance data available</div>'
                    }
                </div>
            </div>
        `;
    }
    
    /**
     * Render health checks section
     * @private
     */
    _renderHealthChecks(routerManager, router) {
        const checks = this._performHealthChecks(routerManager, router);
        
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 5px 0; color: #4CAF50;">🏥 Health Checks</h4>
                <div style="margin-left: 10px;">
                    ${checks.map(check => `
                        <div style="margin-bottom: 3px;">
                            ${check.passed ? '✅' : '❌'} ${check.name}
                            ${check.details ? `<br><span style="margin-left: 15px; color: #888; font-size: 11px;">${check.details}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render route information section
     * @private
     */
    _renderRouteInformation(router) {
        const currentRoute = router ? router.getCurrentRoute() : null;
        const currentPath = router ? router.getCurrentPath() : window.location.pathname;
        
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 5px 0; color: #607D8B;">🗺️ Route Information</h4>
                <div style="margin-left: 10px;">
                    <div>Current Path: <code>${currentPath}</code></div>
                    ${currentRoute ? `
                        <div>Route Handler: <code>${currentRoute.route ? currentRoute.route.handler : 'N/A'}</code></div>
                        <div>Auth Required: ${currentRoute.route && currentRoute.route.auth ? '🔒 Yes' : '🔓 No'}</div>
                        <div>Parameters: <code>${JSON.stringify(currentRoute.params || {})}</code></div>
                    ` : '<div style="color: #888;">No route information available</div>'}
                </div>
            </div>
        `;
    }
    
    /**
     * Render actions section
     * @private
     */
    _renderActions() {
        return `
            <div style="border-top: 1px solid #333; padding-top: 10px;">
                <h4 style="margin: 5px 0; color: #795548;">🔧 Actions</h4>
                <div style="margin-left: 10px;">
                    <button id="debug-reinit-router" style="margin: 2px; padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;">Reinitialize Router</button>
                    <button id="debug-clear-metrics" style="margin: 2px; padding: 5px 10px; background: #FF9800; color: white; border: none; border-radius: 3px; cursor: pointer;">Clear Metrics</button>
                    <button id="debug-test-navigation" style="margin: 2px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Test Navigation</button>
                    <button id="debug-export-logs" style="margin: 2px; padding: 5px 10px; background: #9C27B0; color: white; border: none; border-radius: 3px; cursor: pointer;">Export Logs</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Attach event listeners to action buttons
     * @private
     */
    _attachEventListeners() {
        const reinitBtn = document.getElementById('debug-reinit-router');
        const clearBtn = document.getElementById('debug-clear-metrics');
        const testBtn = document.getElementById('debug-test-navigation');
        const exportBtn = document.getElementById('debug-export-logs');
        
        if (reinitBtn) {
            reinitBtn.onclick = () => this._reinitializeRouter();
        }
        
        if (clearBtn) {
            clearBtn.onclick = () => this._clearMetrics();
        }
        
        if (testBtn) {
            testBtn.onclick = () => this._testNavigation();
        }
        
        if (exportBtn) {
            exportBtn.onclick = () => this._exportLogs();
        }
    }
    
    /**
     * Perform health checks
     * @private
     */
    _performHealthChecks(routerManager, router) {
        const checks = [];
        
        // Check RouterManager availability
        checks.push({
            name: 'RouterManager Available',
            passed: !!routerManager,
            details: routerManager ? 'Singleton instance accessible' : 'RouterManager not found'
        });
        
        // Check Router instance
        checks.push({
            name: 'Router Instance Available',
            passed: !!router,
            details: router ? 'Router instance accessible' : 'Router instance not found'
        });
        
        // Check dependencies
        const dependencies = ['SPARouter', 'AuthGuard', 'ROUTE_CONFIG'];
        dependencies.forEach(dep => {
            checks.push({
                name: `${dep} Dependency`,
                passed: typeof window[dep] !== 'undefined',
                details: typeof window[dep] !== 'undefined' ? 'Available' : 'Missing'
            });
        });
        
        // Check router state
        if (routerManager) {
            const state = routerManager.getState();
            checks.push({
                name: 'Router Initialization',
                passed: state.status === 'ready',
                details: `Status: ${state.status}`
            });
        }
        
        // Check navigation functions
        checks.push({
            name: 'Navigation Function',
            passed: typeof window.navigateToPage === 'function',
            details: typeof window.navigateToPage === 'function' ? 'Available' : 'Missing'
        });
        
        return checks;
    }
    
    /**
     * Get status color based on status
     * @private
     */
    _getStatusColor(status) {
        switch (status) {
            case 'ready': return '#4CAF50';
            case 'initializing': return '#FF9800';
            case 'failed': return '#f44336';
            case 'pending': return '#2196F3';
            default: return '#888';
        }
    }
    
    /**
     * Reinitialize router
     * @private
     */
    async _reinitializeRouter() {
        console.log('🔄 Debug: Reinitializing router...');
        
        const routerManager = window.RouterManager ? window.RouterManager.getInstance() : null;
        if (routerManager) {
            routerManager.destroy();
            const newManager = window.RouterManager.getInstance();
            await newManager.initialize();
            console.log('✅ Debug: Router reinitialized');
        } else {
            console.warn('⚠️ Debug: RouterManager not available');
        }
    }
    
    /**
     * Clear metrics
     * @private
     */
    _clearMetrics() {
        console.log('🧹 Debug: Clearing metrics...');
        
        const routerManager = window.RouterManager ? window.RouterManager.getInstance() : null;
        if (routerManager && routerManager.errorHandler) {
            routerManager.errorHandler.clearMetrics();
            console.log('✅ Debug: Metrics cleared');
        } else {
            console.warn('⚠️ Debug: Error handler not available');
        }
    }
    
    /**
     * Test navigation
     * @private
     */
    _testNavigation() {
        console.log('🧪 Debug: Testing navigation...');
        
        const testRoutes = ['/dashboard', '/login'];
        const router = window.appRouter;
        
        if (router) {
            testRoutes.forEach(route => {
                try {
                    router.navigate(route);
                    console.log(`✅ Debug: Navigation to ${route} successful`);
                } catch (error) {
                    console.error(`❌ Debug: Navigation to ${route} failed:`, error);
                }
            });
        } else {
            console.warn('⚠️ Debug: Router not available for testing');
        }
    }
    
    /**
     * Export logs and debug information
     * @private
     */
    _exportLogs() {
        console.log('📤 Debug: Exporting logs...');
        
        const routerManager = window.RouterManager ? window.RouterManager.getInstance() : null;
        const router = window.appRouter;
        
        const debugData = {
            timestamp: new Date().toISOString(),
            routerState: routerManager ? routerManager.getState() : null,
            errorStatistics: routerManager ? routerManager.getErrorStatistics() : null,
            currentRoute: router ? router.getCurrentRoute() : null,
            healthChecks: this._performHealthChecks(routerManager, router),
            dependencies: {
                SPARouter: typeof window.SPARouter !== 'undefined',
                AuthGuard: typeof window.AuthGuard !== 'undefined',
                ROUTE_CONFIG: typeof window.ROUTE_CONFIG !== 'undefined',
                RouterManager: typeof window.RouterManager !== 'undefined'
            },
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Create and download file
        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `router-debug-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Debug: Logs exported');
    }
}

// Initialize debug panel
window.RouterDebugPanel = RouterDebugPanel;

// Auto-initialize in development mode
if (typeof window !== 'undefined') {
    window.routerDebugPanel = new RouterDebugPanel();
}

console.log('🔧 RouterDebugPanel loaded');