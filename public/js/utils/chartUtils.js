// Chart Utilities - Reusable functions for Chart.js rendering

/**
 * Check if Chart.js is loaded and ready
 * @returns {boolean} True if Chart.js is available
 */
function isChartJsReady() {
    return typeof Chart !== 'undefined' && Chart !== null;
}

/**
 * Wait for Chart.js to be ready, then execute callback
 * @param {Function} callback - Function to execute when Chart.js is ready
 * @param {number} maxAttempts - Maximum number of attempts (default: 50)
 * @param {number} interval - Interval between attempts in ms (default: 100)
 */
function waitForChartJs(callback, maxAttempts = 50, interval = 100) {
    if (isChartJsReady()) {
        callback();
        return;
    }
    
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        if (isChartJsReady()) {
            clearInterval(checkInterval);
            callback();
        } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('Chart.js failed to load after', maxAttempts, 'attempts');
        }
    }, interval);
}

/**
 * Safely destroy a chart instance
 * @param {Chart} chartInstance - Chart instance to destroy
 */
function destroyChart(chartInstance) {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
        try {
            chartInstance.destroy();
        } catch (error) {
            console.warn('Error destroying chart:', error);
        }
    }
}

/**
 * Safely create a chart with error handling
 * @param {HTMLElement} canvasElement - Canvas element
 * @param {Object} config - Chart.js configuration
 * @returns {Chart|null} Chart instance or null if failed
 */
function createChart(canvasElement, config) {
    if (!canvasElement) {
        console.warn('Canvas element not found');
        return null;
    }
    
    if (!isChartJsReady()) {
        console.warn('Chart.js not loaded');
        return null;
    }
    
    try {
        return new Chart(canvasElement, config);
    } catch (error) {
        console.error('Error creating chart:', error);
        return null;
    }
}

/**
 * Render chart with proper timing (waits for DOM and Chart.js)
 * @param {HTMLElement} canvasElement - Canvas element
 * @param {Object} config - Chart.js configuration
 * @param {Function} onReady - Optional callback when chart is ready
 * @returns {Chart|null} Chart instance or null
 */
function renderChart(canvasElement, config, onReady = null) {
    if (!canvasElement) {
        console.warn('Canvas element not found for chart rendering');
        return null;
    }
    
    waitForChartJs(() => {
        // Additional delay to ensure DOM is fully rendered
        setTimeout(() => {
            const chart = createChart(canvasElement, config);
            if (chart && onReady) {
                onReady(chart);
            }
        }, 100);
    });
    
    return null; // Will be set in callback
}

// Export for use in other modules
window.chartUtils = {
    isChartJsReady,
    waitForChartJs,
    destroyChart,
    createChart,
    renderChart
};
