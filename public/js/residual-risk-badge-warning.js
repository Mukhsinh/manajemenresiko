/**
 * Residual Risk Badge Warning System
 * Handles review status warnings with blinking animation for approaching deadlines
 */

const ResidualRiskBadgeWarning = (() => {
    
    /**
     * Check if a date is within the warning threshold (less than 1 month)
     * @param {string|Date} nextReviewDate - The next review date
     * @returns {Object} - Warning status object
     */
    function checkReviewWarning(nextReviewDate) {
        if (!nextReviewDate) {
            return { status: 'unknown', class: 'badge-secondary', text: 'N/A' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const reviewDate = new Date(nextReviewDate);
        reviewDate.setHours(0, 0, 0, 0);
        
        const diffTime = reviewDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Overdue - past deadline
        if (diffDays < 0) {
            return {
                status: 'overdue',
                class: 'badge-review-overdue',
                text: 'OVERDUE',
                daysRemaining: diffDays,
                message: `Overdue by ${Math.abs(diffDays)} days`
            };
        }
        
        // Urgent - less than 7 days
        if (diffDays <= 7) {
            return {
                status: 'urgent',
                class: 'badge-review-urgent',
                text: 'URGENT',
                daysRemaining: diffDays,
                message: `${diffDays} days remaining`
            };
        }
        
        // Warning - less than 30 days (1 month)
        if (diffDays <= 30) {
            return {
                status: 'warning',
                class: 'badge-review-warning',
                text: 'WARNING',
                daysRemaining: diffDays,
                message: `${diffDays} days remaining`
            };
        }
        
        // Normal - more than 30 days
        return {
            status: 'normal',
            class: 'badge-reviewed',
            text: 'REVIEWED',
            daysRemaining: diffDays,
            message: `Next review in ${diffDays} days`
        };
    }

    /**
     * Get badge class for risk level with bright solid colors
     * @param {string} level - Risk level string
     * @returns {string} - CSS class name
     */
    function getBadgeClassForRiskLevel(level) {
        if (!level) return 'badge-secondary';
        
        const levelUpper = level.toUpperCase();
        
        if (levelUpper.includes('LOW') || levelUpper.includes('RENDAH')) {
            return 'badge-low-risk';
        }
        if (levelUpper.includes('MEDIUM') || levelUpper.includes('SEDANG')) {
            return 'badge-medium-risk';
        }
        if (levelUpper.includes('EXTREME') || levelUpper.includes('SANGAT')) {
            return 'badge-extreme-high';
        }
        if (levelUpper.includes('HIGH') || levelUpper.includes('TINGGI')) {
            return 'badge-high-risk';
        }
        
        return 'badge-secondary';
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} - Formatted date string
     */
    function formatDate(date) {
        if (!date) return '-';
        
        try {
            const d = new Date(date);
            return d.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return date;
        }
    }

    /**
     * Create review status badge HTML with warning if needed
     * @param {string} reviewStatus - Current review status
     * @param {string|Date} nextReviewDate - Next review date
     * @returns {string} - HTML string for badge
     */
    function createReviewStatusBadge(reviewStatus, nextReviewDate) {
        const warning = checkReviewWarning(nextReviewDate);
        
        let badgeClass = warning.class;
        let badgeText = reviewStatus || warning.text;
        let tooltip = warning.message || '';
        
        // If there's a warning status, override the badge
        if (warning.status === 'overdue' || warning.status === 'urgent' || warning.status === 'warning') {
            badgeText = warning.text;
        }
        
        return `
            <span class="badge-status ${badgeClass}" 
                  title="${tooltip}"
                  data-review-status="${warning.status}"
                  data-days-remaining="${warning.daysRemaining || 'N/A'}">
                ${badgeText}
            </span>
        `;
    }

    /**
     * Create risk level badge HTML with bright solid colors
     * @param {string} level - Risk level
     * @param {number|string} value - Risk value (optional)
     * @returns {string} - HTML string for badge
     */
    function createRiskLevelBadge(level, value = null) {
        const badgeClass = getBadgeClassForRiskLevel(level);
        const displayText = value !== null ? value : (level || '-');
        
        return `
            <span class="badge-status ${badgeClass}">
                ${displayText}
            </span>
        `;
    }

    /**
     * Update all review status badges on the page
     * Scans for badges and applies warning classes based on dates
     */
    function updateAllReviewBadges() {
        // Find all table rows with review data
        const rows = document.querySelectorAll('.residual-risk-table tbody tr, table tbody tr');
        
        rows.forEach(row => {
            // Look for next review date cell (usually last or second to last column)
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;
            
            // Try to find the review status and next review date cells
            let reviewStatusCell = null;
            let nextReviewCell = null;
            
            cells.forEach((cell, index) => {
                const text = cell.textContent.trim().toLowerCase();
                
                // Check if this looks like a date
                if (text.match(/^\d{4}/) || text.match(/^\d{1,2}[\/\-]/)) {
                    nextReviewCell = cell;
                }
                
                // Check if this is a review status
                if (text.includes('review') || cell.querySelector('.badge-secondary, .badge-reviewed')) {
                    reviewStatusCell = cell;
                }
            });
            
            // If we found both, update the badge
            if (reviewStatusCell && nextReviewCell) {
                const nextReviewDate = nextReviewCell.textContent.trim();
                const currentStatus = reviewStatusCell.textContent.trim();
                
                const warning = checkReviewWarning(nextReviewDate);
                
                // Update the badge if warning is needed
                if (warning.status !== 'normal' && warning.status !== 'unknown') {
                    const existingBadge = reviewStatusCell.querySelector('.badge-status');
                    if (existingBadge) {
                        existingBadge.className = `badge-status ${warning.class}`;
                        existingBadge.textContent = warning.text;
                        existingBadge.title = warning.message;
                    }
                }
            }
        });
    }

    /**
     * Initialize the badge warning system
     */
    function initialize() {
        console.log('[ResidualRiskBadgeWarning] Initializing...');
        
        // Update badges on page load
        updateAllReviewBadges();
        
        // Set up mutation observer to handle dynamically loaded content
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (
                            node.classList?.contains('residual-risk-table') ||
                            node.querySelector?.('.residual-risk-table') ||
                            node.tagName === 'TABLE' ||
                            node.querySelector?.('table')
                        )) {
                            shouldUpdate = true;
                        }
                    });
                }
            });
            
            if (shouldUpdate) {
                setTimeout(updateAllReviewBadges, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[ResidualRiskBadgeWarning] Initialized successfully');
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Public API
    return {
        checkReviewWarning,
        getBadgeClassForRiskLevel,
        createReviewStatusBadge,
        createRiskLevelBadge,
        updateAllReviewBadges,
        formatDate,
        initialize
    };
})();

// Make available globally
window.ResidualRiskBadgeWarning = ResidualRiskBadgeWarning;
