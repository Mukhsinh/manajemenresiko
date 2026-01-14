/**
 * Lucide Icon Integration System v2.0
 * Non-blocking icon loading with fallback support
 * Updated: 2026-01-10
 */

class LucideIconSystem {
    constructor() {
        this.iconMap = new Map();
        this.isInitialized = false;
        this.loadAttempts = 0;
        this.maxLoadAttempts = 2;
        
        // Initialize icon mappings
        this.initializeIconMappings();
    }
    
    /**
     * Initialize icon mappings for different contexts
     */
    initializeIconMappings() {
        // Action button icons
        this.iconMap.set('edit', 'edit');
        this.iconMap.set('delete', 'trash-2');
        this.iconMap.set('view', 'eye');
        this.iconMap.set('add', 'plus');
        this.iconMap.set('save', 'save');
        this.iconMap.set('cancel', 'x');
        
        // Card icons by content type
        this.iconMap.set('risk', 'alert-triangle');
        this.iconMap.set('dashboard', 'layout-dashboard');
        this.iconMap.set('chart', 'bar-chart-3');
        this.iconMap.set('data', 'database');
        this.iconMap.set('report', 'file-text');
        this.iconMap.set('user', 'users');
        this.iconMap.set('settings', 'settings');
        this.iconMap.set('profile', 'user-circle');
        this.iconMap.set('strategy', 'target');
        this.iconMap.set('analysis', 'trending-up');
        this.iconMap.set('monitoring', 'activity');
        this.iconMap.set('evaluation', 'check-circle');
        
        // Navigation icons
        this.iconMap.set('home', 'home');
        this.iconMap.set('menu', 'menu');
        this.iconMap.set('search', 'search');
        this.iconMap.set('filter', 'filter');
        this.iconMap.set('download', 'download');
        this.iconMap.set('upload', 'upload');
        this.iconMap.set('refresh', 'refresh-cw');
        
        // Status icons
        this.iconMap.set('success', 'check-circle');
        this.iconMap.set('error', 'alert-circle');
        this.iconMap.set('warning', 'alert-triangle');
        this.iconMap.set('info', 'info');
        this.iconMap.set('loading', 'loader');
    }
    
    /**
     * Load Lucide library - NON-BLOCKING
     */
    async loadLucide() {
        // Already loaded
        if (window.lucide) {
            this.isInitialized = true;
            return true;
        }
        
        // Max attempts reached
        if (this.loadAttempts >= this.maxLoadAttempts) {
            console.warn('⚠️ Lucide icons: max load attempts reached, using fallback');
            return false;
        }
        
        this.loadAttempts++;
        
        // CDN URLs - ONLY use CSP whitelisted CDNs
        const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js'
        ];
        
        for (const url of cdnUrls) {
            try {
                await this.loadScript(url);
                if (window.lucide) {
                    this.isInitialized = true;
                    console.log('✅ Lucide icons loaded from:', url);
                    return true;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load Lucide from ${url}:`, error.message);
            }
        }
        
        return false;
    }
    
    /**
     * Load script with timeout - NON-BLOCKING
     */
    loadScript(url, timeout = 3000) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            const timeoutId = setTimeout(() => {
                script.remove();
                reject(new Error('Script load timeout'));
            }, timeout);
            
            script.onload = () => {
                clearTimeout(timeoutId);
                resolve();
            };
            
            script.onerror = () => {
                clearTimeout(timeoutId);
                script.remove();
                reject(new Error('Script load failed'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Create all icons in the document - SAFE
     */
    createAllIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try {
                window.lucide.createIcons();
            } catch (e) {
                console.warn('⚠️ Error creating Lucide icons:', e.message);
            }
        }
    }
    
    /**
     * Get icon name mapping
     */
    getIconName(key) {
        return this.iconMap.get(key) || key;
    }
    
    /**
     * Check if system is ready
     */
    isReady() {
        return this.isInitialized && window.lucide;
    }
    
    /**
     * Initialize - NON-BLOCKING, won't prevent page render
     */
    async init() {
        // Don't block - load in background
        this.loadLucide().then(success => {
            if (success) {
                this.createAllIcons();
            }
        }).catch(() => {
            // Silently fail - icons are not critical
        });
    }
}

// Create global instance
const lucideIconSystem = new LucideIconSystem();

// Make available globally
window.LucideIcons = lucideIconSystem;

// NON-BLOCKING initialization - don't wait for icons
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Delay icon loading to not block critical rendering
        setTimeout(() => lucideIconSystem.init(), 100);
    });
} else {
    setTimeout(() => lucideIconSystem.init(), 100);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LucideIconSystem;
}
