/**
 * RouterErrorHandler - Comprehensive error handling for router system
 * Provides structured error logging, user-friendly messages, and performance metrics
 */
class RouterErrorHandler {
    constructor() {
        this.errorCategories = {
            DEPENDENCY: 'dependency',
            TIMEOUT: 'timeout',
            CONFIGURATION: 'configuration',
            RUNTIME: 'runtime'
        };
        
        this.severityLevels = {
            WARNING: 'warning',
            ERROR: 'error',
            CRITICAL: 'critical'
        };
        
        this.metrics = {
            errors: [],
            warnings: [],
            performance: {}
        };
    }
    
    /**
     * Handle dependency errors
     * @param {string[]} missingDependencies
     * @param {number} retryCount
     * @param {number} maxRetries
     * @returns {Object}
     */
    handleDependencyError(missingDependencies, retryCount, maxRetries) {
        const error = {
            category: this.errorCategories.DEPENDENCY,
            severity: retryCount >= maxRetries ? this.severityLevels.CRITICAL : this.severityLevels.WARNING,
            message: `Missing dependencies: ${missingDependencies.join(', ')}`,
            details: {
                missingDependencies,
                retryCount,
                maxRetries,
                timestamp: Date.now()
            },
            userMessage: this._getUserFriendlyMessage('dependency', missingDependencies),
            recovery: this._getRecoveryStrategy('dependency')
        };
        
        this._logError(error);
        return error;
    }
    
    /**
     * Handle timeout errors
     * @param {number} duration
     * @param {number} timeout
     * @returns {Object}
     */
    handleTimeoutError(duration, timeout) {
        const error = {
            category: this.errorCategories.TIMEOUT,
            severity: this.severityLevels.ERROR,
            message: `Router initialization timed out after ${duration}ms (limit: ${timeout}ms)`,
            details: {
                duration,
                timeout,
                timestamp: Date.now()
            },
            userMessage: this._getUserFriendlyMessage('timeout'),
            recovery: this._getRecoveryStrategy('timeout')
        };
        
        this._logError(error);
        return error;
    }
    
    /**
     * Handle configuration errors
     * @param {Error} originalError
     * @param {Object} config
     * @returns {Object}
     */
    handleConfigurationError(originalError, config) {
        const error = {
            category: this.errorCategories.CONFIGURATION,
            severity: this.severityLevels.ERROR,
            message: `Router configuration error: ${originalError.message}`,
            details: {
                originalError: originalError.message,
                stack: originalError.stack,
                config,
                timestamp: Date.now()
            },
            userMessage: this._getUserFriendlyMessage('configuration'),
            recovery: this._getRecoveryStrategy('configuration')
        };
        
        this._logError(error);
        return error;
    }
    
    /**
     * Handle runtime errors
     * @param {Error} originalError
     * @param {string} context
     * @returns {Object}
     */
    handleRuntimeError(originalError, context) {
        const error = {
            category: this.errorCategories.RUNTIME,
            severity: this.severityLevels.CRITICAL,
            message: `Router runtime error in ${context}: ${originalError.message}`,
            details: {
                originalError: originalError.message,
                stack: originalError.stack,
                context,
                timestamp: Date.now()
            },
            userMessage: this._getUserFriendlyMessage('runtime'),
            recovery: this._getRecoveryStrategy('runtime')
        };
        
        this._logError(error);
        return error;
    }
    
    /**
     * Log performance metrics
     * @param {string} operation
     * @param {number} duration
     * @param {boolean} success
     */
    logPerformanceMetric(operation, duration, success) {
        const metric = {
            operation,
            duration,
            success,
            timestamp: Date.now()
        };
        
        if (!this.metrics.performance[operation]) {
            this.metrics.performance[operation] = [];
        }
        
        this.metrics.performance[operation].push(metric);
        
        // Keep only last 100 metrics per operation
        if (this.metrics.performance[operation].length > 100) {
            this.metrics.performance[operation] = this.metrics.performance[operation].slice(-100);
        }
        
        console.log(`📊 Performance: ${operation} took ${duration}ms (${success ? 'success' : 'failed'})`);
    }
    
    /**
     * Get error statistics
     * @returns {Object}
     */
    getErrorStatistics() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        const recentErrors = this.metrics.errors.filter(error => 
            now - error.details.timestamp < oneHour
        );
        
        const recentWarnings = this.metrics.warnings.filter(warning => 
            now - warning.details.timestamp < oneHour
        );
        
        const errorsByCategory = {};
        recentErrors.forEach(error => {
            errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
        });
        
        return {
            totalErrors: recentErrors.length,
            totalWarnings: recentWarnings.length,
            errorsByCategory,
            lastError: this.metrics.errors[this.metrics.errors.length - 1] || null,
            performance: this._getPerformanceStats()
        };
    }
    
    /**
     * Get user-friendly error message
     * @private
     * @param {string} category
     * @param {Array} details
     * @returns {string}
     */
    _getUserFriendlyMessage(category, details = []) {
        switch (category) {
            case 'dependency':
                return 'The application is still loading. Please wait a moment and try again.';
            case 'timeout':
                return 'The application is taking longer than expected to load. Please refresh the page.';
            case 'configuration':
                return 'There is a configuration issue with the application. Please contact support.';
            case 'runtime':
                return 'An unexpected error occurred. The application will use basic navigation mode.';
            default:
                return 'An error occurred while loading the application. Please try refreshing the page.';
        }
    }
    
    /**
     * Get recovery strategy for error category
     * @private
     * @param {string} category
     * @returns {Object}
     */
    _getRecoveryStrategy(category) {
        switch (category) {
            case 'dependency':
                return {
                    action: 'retry',
                    description: 'Wait for dependencies to load and retry initialization',
                    fallback: 'Use legacy navigation if retries fail'
                };
            case 'timeout':
                return {
                    action: 'fallback',
                    description: 'Activate fallback navigation immediately',
                    fallback: 'Page refresh recommended'
                };
            case 'configuration':
                return {
                    action: 'fallback',
                    description: 'Use legacy navigation with basic functionality',
                    fallback: 'Contact support for configuration fix'
                };
            case 'runtime':
                return {
                    action: 'fallback',
                    description: 'Switch to fallback navigation mode',
                    fallback: 'Page refresh may resolve the issue'
                };
            default:
                return {
                    action: 'fallback',
                    description: 'Use basic navigation functionality',
                    fallback: 'Refresh page or contact support'
                };
        }
    }
    
    /**
     * Log error with appropriate severity
     * @private
     * @param {Object} error
     */
    _logError(error) {
        const logMessage = `[${error.category.toUpperCase()}] ${error.message}`;
        
        switch (error.severity) {
            case this.severityLevels.WARNING:
                console.warn(`⚠️ ${logMessage}`, error.details);
                this.metrics.warnings.push(error);
                break;
            case this.severityLevels.ERROR:
                console.error(`❌ ${logMessage}`, error.details);
                this.metrics.errors.push(error);
                break;
            case this.severityLevels.CRITICAL:
                console.error(`🚨 CRITICAL: ${logMessage}`, error.details);
                this.metrics.errors.push(error);
                break;
        }
        
        // Keep only last 100 errors/warnings
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }
        if (this.metrics.warnings.length > 100) {
            this.metrics.warnings = this.metrics.warnings.slice(-100);
        }
    }
    
    /**
     * Get performance statistics
     * @private
     * @returns {Object}
     */
    _getPerformanceStats() {
        const stats = {};
        
        Object.keys(this.metrics.performance).forEach(operation => {
            const metrics = this.metrics.performance[operation];
            const durations = metrics.map(m => m.duration);
            const successCount = metrics.filter(m => m.success).length;
            
            stats[operation] = {
                count: metrics.length,
                successRate: metrics.length > 0 ? (successCount / metrics.length) * 100 : 0,
                averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
                minDuration: durations.length > 0 ? Math.min(...durations) : 0,
                maxDuration: durations.length > 0 ? Math.max(...durations) : 0
            };
        });
        
        return stats;
    }
    
    /**
     * Clear all metrics and errors
     */
    clearMetrics() {
        this.metrics = {
            errors: [],
            warnings: [],
            performance: {}
        };
        console.log('🧹 Router error metrics cleared');
    }
}

// Make available globally
window.RouterErrorHandler = RouterErrorHandler;

console.log('📦 RouterErrorHandler class loaded');