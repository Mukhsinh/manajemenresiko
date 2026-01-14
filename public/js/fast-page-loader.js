/**
 * FAST PAGE LOADER v1.0
 * Optimized page loading untuk mengatasi halaman stuck
 * 
 * FITUR:
 * 1. Loading timeout protection
 * 2. Lazy module loading
 * 3. Progressive rendering
 * 4. Error recovery
 * 
 * Created: 2026-01-09
 */

(function() {
    'use strict';
    
    if (window.FastPageLoader) {
        console.log('⚠️ FastPageLoader already loaded');
        return;
    }
    
    console.log('🚀 Fast Page Loader v1.0 loading...');
    
    const FastPageLoader = {
        version: '1.0',
        loadingPages: new Set(),
        loadedPages: new Set(),
        pageTimeouts: new Map(),
        maxLoadTime: 10000, // 10 seconds max load time
        
        /**
         * Load a page with timeout protection
         */
        async loadPage(pageName, options = {}) {
            console.log(`📄 Loading page: ${pageName}`);
            
            // Prevent duplicate loading
            if (this.loadingPages.has(pageName)) {
                console.log(`⏳ Page ${pageName} already loading`);
                return false;
            }
            
            // Check if already loaded and not forcing reload
            if (this.loadedPages.has(pageName) && !options.force) {
                console.log(`✅ Page ${pageName} already loaded`);
                return true;
            }
            
            this.loadingPages.add(pageName);
            
            // Show loading indicator
            this.showLoadingIndicator(pageName);
            
            // Create timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error(`Page load timeout: ${pageName}`));
                }, options.timeout || this.maxLoadTime);
                
                this.pageTimeouts.set(pageName, timeoutId);
            });
            
            try {
                // Race between actual load and timeout
                await Promise.race([
                    this.performPageLoad(pageName, options),
                    timeoutPromise
                ]);
                
                // Clear timeout
                this.clearPageTimeout(pageName);
                
                // Mark as loaded
                this.loadingPages.delete(pageName);
                this.loadedPages.add(pageName);
                
                // Hide loading indicator
                this.hideLoadingIndicator(pageName);
                
                console.log(`✅ Page ${pageName} loaded successfully`);
                return true;
                
            } catch (error) {
                console.error(`❌ Error loading page ${pageName}:`, error);
                
                // Clear timeout
                this.clearPageTimeout(pageName);
                
                // Cleanup
                this.loadingPages.delete(pageName);
                
                // Hide loading indicator
                this.hideLoadingIndicator(pageName);
                
                // Show error with retry option
                this.showLoadError(pageName, error);
                
                return false;
            }
        },
        
        /**
         * Perform actual page load
         */
        async performPageLoad(pageName, options) {
            // Get page element
            const pageElement = document.getElementById(pageName);
            if (!pageElement) {
                throw new Error(`Page element not found: ${pageName}`);
            }
            
            // Make page visible
            this.activatePage(pageName);
            
            // Load page-specific module
            await this.loadPageModule(pageName, options);
            
            // Render page content
            await this.renderPageContent(pageName, options);
        },
        
        /**
         * Activate page (show it, hide others)
         */
        activatePage(pageName) {
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(page => {
                if (page.id !== pageName) {
                    page.classList.remove('active');
                    page.style.display = 'none';
                }
            });
            
            // Show target page
            const targetPage = document.getElementById(pageName);
            if (targetPage) {
                targetPage.classList.add('active');
                targetPage.style.display = 'block';
                targetPage.style.visibility = 'visible';
                targetPage.style.opacity = '1';
            }
        },
        
        /**
         * Load page-specific module
         */
        async loadPageModule(pageName, options) {
            const moduleMap = {
                'rencana-strategis': 'RencanaStrategisModule',
                'dashboard': 'dashboardModule',
                'analisis-swot': 'analisisSwotModule',
                'risk-residual': 'residualRiskModule',
                'risk-profile': 'riskProfileModule',
                'monitoring-evaluasi': 'monitoringEvaluasiModule'
            };
            
            const moduleName = moduleMap[pageName];
            if (!moduleName) {
                console.log(`ℹ️ No specific module for page: ${pageName}`);
                return;
            }
            
            // Wait for module with timeout
            const module = await this.waitForModule(moduleName, 5000);
            
            if (module && typeof module.load === 'function') {
                console.log(`📦 Loading module: ${moduleName}`);
                await module.load();
            }
        },
        
        /**
         * Wait for module to be available
         */
        waitForModule(moduleName, timeout = 5000) {
            return new Promise((resolve) => {
                const startTime = Date.now();
                
                const check = () => {
                    if (window[moduleName]) {
                        resolve(window[moduleName]);
                        return;
                    }
                    
                    if (Date.now() - startTime > timeout) {
                        console.warn(`⚠️ Module ${moduleName} not available after ${timeout}ms`);
                        resolve(null);
                        return;
                    }
                    
                    setTimeout(check, 100);
                };
                
                check();
            });
        },
        
        /**
         * Render page content
         */
        async renderPageContent(pageName, options) {
            // Get content container
            const container = document.getElementById(`${pageName}-content`) ||
                             document.querySelector(`#${pageName} .page-content-inner`) ||
                             document.getElementById(pageName);
            
            if (!container) return;
            
            // Check if content already exists
            const hasContent = container.querySelector('table, .card, .data-container');
            if (hasContent && !options.force) {
                console.log(`✅ Page ${pageName} already has content`);
                return;
            }
            
            // Trigger any pending renders
            container.offsetHeight; // Force reflow
        },
        
        /**
         * Show loading indicator
         */
        showLoadingIndicator(pageName) {
            // Remove existing indicator
            this.hideLoadingIndicator(pageName);
            
            const indicator = document.createElement('div');
            indicator.id = `loading-${pageName}`;
            indicator.className = 'fast-page-loading';
            indicator.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Memuat ${this.formatPageName(pageName)}...</p>
            `;
            
            // Add styles
            indicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: system-ui, -apple-system, sans-serif;
            `;
            
            // Add spinner styles
            const style = document.createElement('style');
            style.textContent = `
                .fast-page-loading .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e5e7eb;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: fast-spin 0.8s linear infinite;
                }
                @keyframes fast-spin {
                    to { transform: rotate(360deg); }
                }
                .fast-page-loading p {
                    margin-top: 16px;
                    color: #6b7280;
                    font-size: 14px;
                }
            `;
            indicator.appendChild(style);
            
            document.body.appendChild(indicator);
        },
        
        /**
         * Hide loading indicator
         */
        hideLoadingIndicator(pageName) {
            const indicator = document.getElementById(`loading-${pageName}`);
            if (indicator) {
                indicator.remove();
            }
        },
        
        /**
         * Show load error with retry option
         */
        showLoadError(pageName, error) {
            const container = document.getElementById(`${pageName}-content`) ||
                             document.getElementById(pageName);
            
            if (container) {
                container.innerHTML = `
                    <div class="load-error" style="
                        padding: 40px;
                        text-align: center;
                        background: #fef2f2;
                        border-radius: 8px;
                        margin: 20px;
                    ">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: #fee2e2;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 16px;
                        ">
                            <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 24px;"></i>
                        </div>
                        <h4 style="color: #991b1b; margin-bottom: 8px;">Gagal Memuat Halaman</h4>
                        <p style="color: #7f1d1d; margin-bottom: 16px;">${error.message}</p>
                        <button onclick="FastPageLoader.retryLoad('${pageName}')" style="
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            <i class="fas fa-sync-alt"></i> Coba Lagi
                        </button>
                    </div>
                `;
            }
        },
        
        /**
         * Retry loading a page
         */
        retryLoad(pageName) {
            this.loadedPages.delete(pageName);
            this.loadPage(pageName, { force: true });
        },
        
        /**
         * Clear page timeout
         */
        clearPageTimeout(pageName) {
            const timeoutId = this.pageTimeouts.get(pageName);
            if (timeoutId) {
                clearTimeout(timeoutId);
                this.pageTimeouts.delete(pageName);
            }
        },
        
        /**
         * Format page name for display
         */
        formatPageName(pageName) {
            const names = {
                'rencana-strategis': 'Rencana Strategis',
                'dashboard': 'Dashboard',
                'analisis-swot': 'Analisis SWOT',
                'risk-residual': 'Risk Residual',
                'risk-profile': 'Risk Profile',
                'monitoring-evaluasi': 'Monitoring & Evaluasi'
            };
            
            return names[pageName] || pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        },
        
        /**
         * Preload a page in background
         */
        preloadPage(pageName) {
            if (this.loadedPages.has(pageName)) return;
            
            // Use requestIdleCallback for background loading
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    this.loadPageModule(pageName, {});
                }, { timeout: 5000 });
            }
        },
        
        /**
         * Get loading status
         */
        getStatus() {
            return {
                loading: Array.from(this.loadingPages),
                loaded: Array.from(this.loadedPages),
                pendingTimeouts: this.pageTimeouts.size
            };
        }
    };
    
    // Export to global scope
    window.FastPageLoader = FastPageLoader;
    
    console.log('✅ Fast Page Loader ready');
    
})();
