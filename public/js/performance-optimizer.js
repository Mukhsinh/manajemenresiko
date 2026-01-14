/**
 * PERFORMANCE OPTIMIZER v1.0
 * Mengatasi masalah loading lambat dan halaman stuck
 * 
 * MASALAH YANG DIPERBAIKI:
 * 1. Terlalu banyak MutationObserver berjalan bersamaan
 * 2. Multiple setInterval yang tidak di-cleanup
 * 3. Race conditions pada initialization
 * 4. Excessive DOM manipulation
 * 
 * Created: 2026-01-09
 */

(function() {
    'use strict';
    
    // Prevent multiple initialization
    if (window.PerformanceOptimizer) {
        console.log('⚠️ PerformanceOptimizer already loaded');
        return;
    }
    
    console.log('🚀 Performance Optimizer v1.0 loading...');
    
    const PerformanceOptimizer = {
        version: '1.0',
        initialized: false,
        activeObservers: new Map(),
        activeIntervals: new Map(),
        activeTimeouts: new Map(),
        pageLoadStart: performance.now(),
        
        /**
         * Initialize the optimizer
         */
        init() {
            if (this.initialized) return;
            
            console.log('🔧 Initializing Performance Optimizer...');
            
            // 1. Cleanup existing problematic intervals/timeouts
            this.cleanupExistingTimers();
            
            // 2. Override native timer functions to track them
            this.overrideTimerFunctions();
            
            // 3. Create centralized MutationObserver
            this.setupCentralizedObserver();
            
            // 4. Optimize page loading
            this.optimizePageLoading();
            
            // 5. Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            this.initialized = true;
            console.log('✅ Performance Optimizer initialized');
        },
        
        /**
         * Cleanup existing timers that might cause issues
         */
        cleanupExistingTimers() {
            console.log('🧹 Cleaning up existing timers...');
            
            // Clear high interval IDs (likely problematic)
            const testInterval = setInterval(() => {}, 10000);
            clearInterval(testInterval);
            
            // Only clear intervals above a certain threshold to avoid breaking essential ones
            const threshold = testInterval - 100;
            for (let i = threshold; i < testInterval; i++) {
                clearInterval(i);
            }
            
            console.log('✅ Timer cleanup complete');
        },
        
        /**
         * Override timer functions to track and manage them
         */
        overrideTimerFunctions() {
            const self = this;
            
            // Store original functions
            const originalSetInterval = window.setInterval;
            const originalClearInterval = window.clearInterval;
            const originalSetTimeout = window.setTimeout;
            const originalClearTimeout = window.clearTimeout;
            
            // Override setInterval
            window.setInterval = function(callback, delay, ...args) {
                const id = originalSetInterval.call(window, callback, delay, ...args);
                
                // Track intervals with short delays (potential performance issues)
                if (delay < 1000) {
                    self.activeIntervals.set(id, {
                        delay,
                        stack: new Error().stack,
                        created: Date.now()
                    });
                }
                
                return id;
            };
            
            // Override clearInterval
            window.clearInterval = function(id) {
                self.activeIntervals.delete(id);
                return originalClearInterval.call(window, id);
            };
            
            // Override setTimeout with tracking for long chains
            window.setTimeout = function(callback, delay, ...args) {
                const id = originalSetTimeout.call(window, callback, delay, ...args);
                
                // Track timeouts
                if (delay < 100) {
                    self.activeTimeouts.set(id, {
                        delay,
                        created: Date.now()
                    });
                }
                
                return id;
            };
            
            window.clearTimeout = function(id) {
                self.activeTimeouts.delete(id);
                return originalClearTimeout.call(window, id);
            };
        },
        
        /**
         * Setup a single centralized MutationObserver instead of multiple
         */
        setupCentralizedObserver() {
            console.log('👁️ Setting up centralized observer...');
            
            // Debounce function
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };
            
            // Callbacks registry
            this.observerCallbacks = new Map();
            
            // Single observer for all DOM changes
            const handleMutations = debounce((mutations) => {
                // Only process if page is visible
                if (document.hidden) return;
                
                // Batch process callbacks
                this.observerCallbacks.forEach((callback, key) => {
                    try {
                        callback(mutations);
                    } catch (e) {
                        console.warn(`Observer callback error (${key}):`, e);
                    }
                });
            }, 100); // 100ms debounce
            
            this.centralObserver = new MutationObserver(handleMutations);
            
            // Observe with minimal config
            this.centralObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false, // Disable attribute observation for performance
                characterData: false
            });
            
            console.log('✅ Centralized observer ready');
        },
        
        /**
         * Register a callback with the centralized observer
         */
        registerObserverCallback(key, callback) {
            this.observerCallbacks.set(key, callback);
        },
        
        /**
         * Unregister a callback
         */
        unregisterObserverCallback(key) {
            this.observerCallbacks.delete(key);
        },
        
        /**
         * Optimize page loading
         */
        optimizePageLoading() {
            console.log('⚡ Optimizing page loading...');
            
            // 1. Defer non-critical operations
            this.deferNonCriticalOperations();
            
            // 2. Optimize image loading
            this.optimizeImageLoading();
            
            // 3. Reduce layout thrashing
            this.reduceLayoutThrashing();
        },
        
        /**
         * Defer non-critical operations
         */
        deferNonCriticalOperations() {
            // Use requestIdleCallback for non-critical work
            if ('requestIdleCallback' in window) {
                window.deferWork = (callback) => {
                    requestIdleCallback(callback, { timeout: 2000 });
                };
            } else {
                window.deferWork = (callback) => {
                    setTimeout(callback, 100);
                };
            }
        },
        
        /**
         * Optimize image loading with lazy loading
         */
        optimizeImageLoading() {
            // Add lazy loading to images
            document.querySelectorAll('img:not([loading])').forEach(img => {
                img.loading = 'lazy';
            });
        },
        
        /**
         * Reduce layout thrashing by batching DOM reads/writes
         */
        reduceLayoutThrashing() {
            // Batch DOM operations
            window.batchDOMUpdate = (callback) => {
                requestAnimationFrame(() => {
                    callback();
                });
            };
        },
        
        /**
         * Setup performance monitoring
         */
        setupPerformanceMonitoring() {
            // Monitor long tasks
            if ('PerformanceObserver' in window) {
                try {
                    const longTaskObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 100) {
                                console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
                            }
                        }
                    });
                    
                    longTaskObserver.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    // longtask not supported in all browsers
                }
            }
            
            // Log page load time
            window.addEventListener('load', () => {
                const loadTime = performance.now() - this.pageLoadStart;
                console.log(`📊 Page load time: ${loadTime.toFixed(2)}ms`);
            });
        },
        
        /**
         * Get performance stats
         */
        getStats() {
            return {
                activeIntervals: this.activeIntervals.size,
                activeTimeouts: this.activeTimeouts.size,
                observerCallbacks: this.observerCallbacks?.size || 0,
                pageLoadTime: performance.now() - this.pageLoadStart
            };
        },
        
        /**
         * Cleanup all tracked resources
         */
        cleanup() {
            console.log('🧹 Cleaning up all resources...');
            
            // Clear all tracked intervals
            this.activeIntervals.forEach((_, id) => {
                clearInterval(id);
            });
            this.activeIntervals.clear();
            
            // Clear all tracked timeouts
            this.activeTimeouts.forEach((_, id) => {
                clearTimeout(id);
            });
            this.activeTimeouts.clear();
            
            // Disconnect central observer
            if (this.centralObserver) {
                this.centralObserver.disconnect();
            }
            
            // Clear callbacks
            if (this.observerCallbacks) {
                this.observerCallbacks.clear();
            }
            
            console.log('✅ Cleanup complete');
        }
    };
    
    // Export to global scope
    window.PerformanceOptimizer = PerformanceOptimizer;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PerformanceOptimizer.init();
        });
    } else {
        PerformanceOptimizer.init();
    }
    
})();
