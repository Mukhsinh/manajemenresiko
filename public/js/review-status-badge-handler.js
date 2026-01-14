/**
 * Review Status Badge Handler
 * Menangani badge reviewed dengan warna berdasarkan jarak waktu ke deadline:
 * - Hijau cerah solid: > 1 bulan dari deadline (aman)
 * - Merah solid berkedip: < 1 bulan dari deadline (urgent)
 * - Merah gelap berkedip cepat: < 7 hari atau overdue (critical)
 */

(function() {
    'use strict';

    const ReviewStatusBadgeHandler = {
        // Time thresholds in days
        thresholds: {
            safe: 30,      // > 30 days = safe (green)
            urgent: 7,     // 7-30 days = urgent (red blinking)
            critical: 0    // < 7 days or overdue = critical (dark red fast blinking)
        },

        /**
         * Calculate days until review date
         * @param {string} reviewDate - Next review date string
         * @returns {number} Days until review (negative if overdue)
         */
        getDaysUntilReview: function(reviewDate) {
            if (!reviewDate) return null;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const review = new Date(reviewDate);
            review.setHours(0, 0, 0, 0);
            
            const diffTime = review - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays;
        },

        /**
         * Get badge class based on days until review
         * @param {number} daysUntil - Days until review
         * @returns {string} CSS class name
         */
        getBadgeClass: function(daysUntil) {
            if (daysUntil === null) {
                return 'badge-secondary';
            }
            
            if (daysUntil > this.thresholds.safe) {
                return 'badge-review-safe';
            } else if (daysUntil > this.thresholds.urgent) {
                return 'badge-review-urgent';
            } else {
                return 'badge-review-critical';
            }
        },

        /**
         * Get badge text with icon
         * @param {string} status - Review status
         * @param {number} daysUntil - Days until review
         * @returns {string} Badge text
         */
        getBadgeText: function(status, daysUntil) {
            if (daysUntil === null) {
                return status || 'N/A';
            }
            
            if (daysUntil > this.thresholds.safe) {
                return `${status || 'REVIEWED'}`;
            } else if (daysUntil > this.thresholds.urgent) {
                return `${status || 'REVIEWED'} (${daysUntil}d)`;
            } else if (daysUntil > 0) {
                return `${status || 'REVIEW'} (${daysUntil}d!)`;
            } else if (daysUntil === 0) {
                return `TODAY!`;
            } else {
                return `OVERDUE (${Math.abs(daysUntil)}d)`;
            }
        },

        /**
         * Create badge HTML element
         * @param {string} status - Review status
         * @param {string} nextReviewDate - Next review date
         * @returns {string} HTML string
         */
        createBadgeHTML: function(status, nextReviewDate) {
            const daysUntil = this.getDaysUntilReview(nextReviewDate);
            const badgeClass = this.getBadgeClass(daysUntil);
            const badgeText = this.getBadgeText(status, daysUntil);
            
            let tooltip = '';
            if (nextReviewDate) {
                const formattedDate = new Date(nextReviewDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                tooltip = `title="Next Review: ${formattedDate}"`;
            }
            
            return `<span class="badge-review-status ${badgeClass}" ${tooltip}>${badgeText}</span>`;
        },

        /**
         * Update all review badges on the page
         */
        updateAllBadges: function() {
            const badges = document.querySelectorAll('[data-review-date]');
            
            badges.forEach(badge => {
                const reviewDate = badge.getAttribute('data-review-date');
                const status = badge.getAttribute('data-review-status') || 'REVIEWED';
                
                const daysUntil = this.getDaysUntilReview(reviewDate);
                const badgeClass = this.getBadgeClass(daysUntil);
                const badgeText = this.getBadgeText(status, daysUntil);
                
                // Remove old classes
                badge.classList.remove('badge-review-safe', 'badge-review-urgent', 'badge-review-critical', 'badge-secondary');
                
                // Add new class
                badge.classList.add(badgeClass);
                
                // Update text
                badge.textContent = badgeText;
            });
        },

        /**
         * Initialize badge handler
         */
        init: function() {
            console.log('[ReviewStatusBadgeHandler] Initializing...');
            
            // Update badges on page load
            this.updateAllBadges();
            
            // Set up periodic update (every minute)
            setInterval(() => {
                this.updateAllBadges();
            }, 60000);
            
            console.log('[ReviewStatusBadgeHandler] Initialized');
        }
    };

    // Expose globally
    window.ReviewStatusBadgeHandler = ReviewStatusBadgeHandler;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ReviewStatusBadgeHandler.init());
    } else {
        ReviewStatusBadgeHandler.init();
    }

})();
