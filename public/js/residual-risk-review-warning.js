/**
 * Residual Risk Review Warning System
 * Menambahkan warning berkedip untuk review yang mendekati deadline < 1 bulan
 * dan memperbaiki tampilan badge dengan warna cerah solid
 */

(function() {
    'use strict';

    const ReviewWarningSystem = {
        // Configuration
        config: {
            urgentDays: 7,      // < 7 hari = urgent (merah berkedip cepat)
            warningDays: 30,    // < 30 hari = warning (merah berkedip)
            nearDeadlineDays: 14 // < 14 hari = near deadline (orange berkedip)
        },

        /**
         * Initialize the warning system
         */
        init: function() {
            console.log('[ReviewWarning] Initializing review warning system...');
            this.applyBadgeEnhancements();
            this.setupMutationObserver();
        },

        /**
         * Calculate days until review date
         * @param {string} reviewDateStr - Review date string
         * @returns {number} Days until review (negative if overdue)
         */
        getDaysUntilReview: function(reviewDateStr) {
            if (!reviewDateStr || reviewDateStr === '-') return null;
            
            try {
                const reviewDate = new Date(reviewDateStr);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                reviewDate.setHours(0, 0, 0, 0);
                
                const diffTime = reviewDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                return diffDays;
            } catch (e) {
                console.warn('[ReviewWarning] Error parsing date:', reviewDateStr, e);
                return null;
            }
        },

        /**
         * Get appropriate badge class based on days until review
         * @param {number} daysUntil - Days until review
         * @returns {string} CSS class name
         */
        getReviewBadgeClass: function(daysUntil) {
            if (daysUntil === null) return 'badge-secondary';
            
            if (daysUntil < 0) {
                // Overdue - urgent blinking
                return 'badge-review-urgent';
            } else if (daysUntil <= this.config.urgentDays) {
                // Less than 7 days - urgent blinking
                return 'badge-review-urgent';
            } else if (daysUntil <= this.config.nearDeadlineDays) {
                // Less than 14 days - near deadline blinking
                return 'badge-review-near-deadline';
            } else if (daysUntil <= this.config.warningDays) {
                // Less than 30 days - warning blinking
                return 'badge-review-warning';
            }
            
            return 'badge-reviewed';
        },

        /**
         * Get warning text based on days until review
         * @param {number} daysUntil - Days until review
         * @returns {string} Warning text
         */
        getWarningText: function(daysUntil) {
            if (daysUntil === null) return '';
            
            if (daysUntil < 0) {
                return `OVERDUE ${Math.abs(daysUntil)} hari`;
            } else if (daysUntil === 0) {
                return 'HARI INI!';
            } else if (daysUntil === 1) {
                return 'BESOK!';
            } else if (daysUntil <= this.config.urgentDays) {
                return `${daysUntil} HARI LAGI!`;
            } else if (daysUntil <= this.config.warningDays) {
                return `${daysUntil} hari lagi`;
            }
            
            return '';
        },

        /**
         * Apply badge enhancements to all risk level badges
         */
        applyBadgeEnhancements: function() {
            console.log('[ReviewWarning] Applying badge enhancements...');
            
            // Find all tables with residual risk data
            const tables = document.querySelectorAll('.residual-risk-table, .table');
            
            tables.forEach(table => {
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    // Find review status and next review date cells
                    const cells = row.querySelectorAll('td');
                    
                    cells.forEach((cell, index) => {
                        // Check if this is a review date cell (usually last or second to last)
                        const cellText = cell.textContent.trim();
                        
                        // Check for date format (YYYY-MM-DD or DD/MM/YYYY)
                        if (this.isDateString(cellText)) {
                            const daysUntil = this.getDaysUntilReview(cellText);
                            
                            if (daysUntil !== null && daysUntil <= this.config.warningDays) {
                                // Find the review status badge in the same row
                                const reviewStatusCell = cells[cells.length - 2]; // Usually second to last
                                const reviewStatusBadge = reviewStatusCell?.querySelector('.badge-status, .badge');
                                
                                if (reviewStatusBadge) {
                                    // Remove existing badge classes
                                    reviewStatusBadge.classList.remove(
                                        'badge-secondary', 'badge-reviewed', 'badge-pending',
                                        'badge-review-warning', 'badge-review-urgent', 'badge-review-near-deadline'
                                    );
                                    
                                    // Add appropriate warning class
                                    const warningClass = this.getReviewBadgeClass(daysUntil);
                                    reviewStatusBadge.classList.add(warningClass);
                                    
                                    // Update badge text with warning
                                    const warningText = this.getWarningText(daysUntil);
                                    if (warningText) {
                                        reviewStatusBadge.setAttribute('title', warningText);
                                    }
                                }
                                
                                // Also highlight the date cell
                                if (daysUntil <= this.config.urgentDays) {
                                    cell.style.color = '#EF4444';
                                    cell.style.fontWeight = 'bold';
                                } else if (daysUntil <= this.config.nearDeadlineDays) {
                                    cell.style.color = '#F97316';
                                    cell.style.fontWeight = '600';
                                }
                            }
                        }
                        
                        // Enhance risk level badges
                        const badges = cell.querySelectorAll('.badge-status, .badge');
                        badges.forEach(badge => {
                            this.enhanceRiskBadge(badge);
                        });
                    });
                });
            });
        },

        /**
         * Check if string is a date
         * @param {string} str - String to check
         * @returns {boolean}
         */
        isDateString: function(str) {
            if (!str || str === '-') return false;
            
            // Check for common date formats
            const datePatterns = [
                /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
                /^\d{2}\/\d{2}\/\d{4}$/,         // DD/MM/YYYY
                /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY
                /^\d{4}\/\d{2}\/\d{2}$/          // YYYY/MM/DD
            ];
            
            return datePatterns.some(pattern => pattern.test(str));
        },

        /**
         * Enhance individual risk badge with solid colors
         * @param {HTMLElement} badge - Badge element
         */
        enhanceRiskBadge: function(badge) {
            const text = badge.textContent.trim().toUpperCase();
            
            // Remove old classes
            badge.classList.remove(
                'badge-success', 'badge-warning', 'badge-danger', 'badge-info',
                'bg-success', 'bg-warning', 'bg-danger', 'bg-info'
            );
            
            // Add appropriate solid color class
            if (text.includes('LOW') || text.includes('RENDAH')) {
                badge.classList.add('badge-low-risk');
            } else if (text.includes('MEDIUM') || text.includes('SEDANG')) {
                badge.classList.add('badge-medium-risk');
            } else if (text.includes('HIGH') && !text.includes('EXTREME')) {
                badge.classList.add('badge-high-risk');
            } else if (text.includes('EXTREME') || text.includes('SANGAT')) {
                badge.classList.add('badge-extreme-high');
            } else if (text.includes('REVIEWED')) {
                badge.classList.add('badge-reviewed');
            } else if (text.includes('PENDING')) {
                badge.classList.add('badge-pending');
            }
        },

        /**
         * Setup mutation observer to handle dynamically loaded content
         */
        setupMutationObserver: function() {
            const observer = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                
                mutations.forEach(mutation => {
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Element node
                                if (node.classList?.contains('residual-risk-table') ||
                                    node.querySelector?.('.residual-risk-table') ||
                                    node.querySelector?.('.badge-status')) {
                                    shouldUpdate = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldUpdate) {
                    // Debounce the update
                    clearTimeout(this.updateTimeout);
                    this.updateTimeout = setTimeout(() => {
                        this.applyBadgeEnhancements();
                    }, 100);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        /**
         * Manual refresh of warning system
         */
        refresh: function() {
            console.log('[ReviewWarning] Manual refresh triggered');
            this.applyBadgeEnhancements();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ReviewWarningSystem.init());
    } else {
        ReviewWarningSystem.init();
    }

    // Also run after a short delay to catch dynamically loaded content
    setTimeout(() => ReviewWarningSystem.refresh(), 1000);
    setTimeout(() => ReviewWarningSystem.refresh(), 3000);

    // Expose globally
    window.ReviewWarningSystem = ReviewWarningSystem;

})();
