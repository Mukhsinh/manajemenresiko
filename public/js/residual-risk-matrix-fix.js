/**
 * Residual Risk Matrix Fix
 * Fixes chart icons to be smaller and ensures all icons display perfectly
 * Uses bright solid colors for the matrix background
 */

const ResidualRiskMatrixFix = (() => {
    
    // Bright solid colors for risk matrix zones
    const MATRIX_COLORS = {
        LOW: '#10B981',      // Bright Green
        MEDIUM: '#F59E0B',   // Bright Yellow/Orange  
        HIGH: '#EF4444',     // Bright Red
        EXTREME: '#991B1B'   // Dark Red/Maroon
    };

    // Chart point configuration - SMALLER ICONS
    const POINT_CONFIG = {
        inherent: {
            backgroundColor: '#00E5FF',  // Bright Cyan
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 7,              // Smaller radius
            pointHoverRadius: 9,
            pointStyle: 'circle'
        },
        residual: {
            backgroundColor: '#FFD700',  // Bright Gold
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 9,              // Smaller radius for star
            pointHoverRadius: 11,
            pointStyle: 'star'
        },
        appetite: {
            backgroundColor: '#FFFFFF',  // White
            borderColor: '#000000',
            borderWidth: 2,
            pointRadius: 7,              // Smaller radius
            pointHoverRadius: 9,
            pointStyle: 'triangle'
        }
    };

    /**
     * Get risk zone color based on probability and impact
     * @param {number} probability - Y axis value (1-5)
     * @param {number} impact - X axis value (1-5)
     * @returns {string} - Color hex code
     */
    function getRiskZoneColor(probability, impact) {
        const riskValue = probability * impact;
        
        if (riskValue <= 4) return MATRIX_COLORS.LOW;
        if (riskValue <= 9) return MATRIX_COLORS.MEDIUM;
        if (riskValue <= 16) return MATRIX_COLORS.HIGH;
        return MATRIX_COLORS.EXTREME;
    }

    /**
     * Create the risk matrix background plugin for Chart.js
     * @returns {Object} - Chart.js plugin object
     */
    function createMatrixBackgroundPlugin() {
        return {
            id: 'riskMatrixBackground',
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const xScale = chart.scales.x;
                const yScale = chart.scales.y;

                if (!chartArea || !xScale || !yScale) return;

                // Draw risk zones with bright solid colors
                for (let y = 1; y <= 5; y++) {
                    for (let x = 1; x <= 5; x++) {
                        const color = getRiskZoneColor(y, x);
                        
                        const x1 = xScale.getPixelForValue(x - 0.5);
                        const x2 = xScale.getPixelForValue(x + 0.5);
                        const y1 = yScale.getPixelForValue(y + 0.5);
                        const y2 = yScale.getPixelForValue(y - 0.5);

                        ctx.fillStyle = color;
                        ctx.globalAlpha = 0.7;
                        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
                        
                        // Add cell border
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = 0.5;
                        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                        
                        ctx.globalAlpha = 1;
                    }
                }
            }
        };
    }

    /**
     * Create chart configuration with smaller icons
     * @param {Array} inherentPoints - Inherent risk data points
     * @param {Array} residualPoints - Residual risk data points
     * @param {Array} appetitePoints - Risk appetite data points (optional)
     * @returns {Object} - Chart.js configuration object
     */
    function createChartConfig(inherentPoints, residualPoints, appetitePoints = []) {
        const datasets = [
            {
                label: 'Inherent Risk Rating',
                data: inherentPoints,
                ...POINT_CONFIG.inherent
            },
            {
                label: 'Residual Risk Rating (★)',
                data: residualPoints,
                ...POINT_CONFIG.residual
            }
        ];

        // Add appetite points if provided
        if (appetitePoints.length > 0) {
            datasets.push({
                label: 'Risk Appetite',
                data: appetitePoints,
                ...POINT_CONFIG.appetite
            });
        }

        return {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: 0.5,
                        max: 5.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const labels = {
                                    1: '1-Ringan Sekali',
                                    2: '2-Ringan',
                                    3: '3-Sedang',
                                    4: '4-Berat',
                                    5: '5-Sangat Berat'
                                };
                                return labels[value] || '';
                            },
                            font: { size: 10 }
                        },
                        title: {
                            display: true,
                            text: 'Dampak',
                            font: { weight: 'bold', size: 12 }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        min: 0.5,
                        max: 5.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const labels = {
                                    1: '1-≤10%',
                                    2: '2-10-40%',
                                    3: '3-40-60%',
                                    4: '4-60-80%',
                                    5: '5->80%'
                                };
                                return labels[value] || '';
                            },
                            font: { size: 10 }
                        },
                        title: {
                            display: true,
                            text: 'Probabilitas',
                            font: { weight: 'bold', size: 12 }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 12, weight: 'bold' },
                        bodyFont: { size: 11 },
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `Kode: ${point.riskId || point.riskCode || 'N/A'}`,
                                    `Risk Value: ${point.value || point.riskValue || 'N/A'}`,
                                    `Level: ${point.level || point.riskLevel || 'N/A'}`
                                ];
                            }
                        }
                    }
                }
            },
            plugins: [createMatrixBackgroundPlugin()]
        };
    }

    /**
     * Initialize or update the residual risk matrix chart
     * @param {string} canvasId - Canvas element ID
     * @param {Array} data - Risk data array
     * @returns {Chart|null} - Chart instance or null
     */
    function initializeChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || typeof Chart === 'undefined') {
            console.warn('[ResidualRiskMatrixFix] Canvas or Chart.js not available');
            return null;
        }

        // Destroy existing chart if any
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Prepare data points
        const inherentPoints = [];
        const residualPoints = [];
        const appetitePoints = [];

        (data || []).forEach(item => {
            const risk = item.risk_inputs || {};
            
            // Get inherent data
            let inherent = {};
            if (risk.risk_inherent_analysis) {
                if (Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
                    inherent = risk.risk_inherent_analysis[0];
                } else if (!Array.isArray(risk.risk_inherent_analysis)) {
                    inherent = risk.risk_inherent_analysis;
                }
            }

            const impact = parseFloat(item.impact) || 0;
            const probability = parseFloat(item.probability) || 0;

            if (impact > 0 && probability > 0) {
                // Residual point
                residualPoints.push({
                    x: impact,
                    y: probability,
                    riskId: risk.kode_risiko || 'N/A',
                    value: parseFloat(item.risk_value) || 0,
                    level: item.risk_level || 'UNKNOWN'
                });

                // Inherent point
                const inherentValue = parseFloat(inherent.risk_value) || 0;
                if (inherentValue > 0) {
                    inherentPoints.push({
                        x: parseFloat(inherent.impact) || impact,
                        y: parseFloat(inherent.probability) || probability,
                        riskId: risk.kode_risiko || 'N/A',
                        value: inherentValue,
                        level: inherent.risk_level || 'UNKNOWN'
                    });
                }

                // Risk appetite point (lower risk target)
                appetitePoints.push({
                    x: Math.max(1, impact - 1),
                    y: Math.max(1, probability - 1),
                    riskId: risk.kode_risiko || 'N/A',
                    value: Math.max(1, (parseFloat(item.risk_value) || 0) - 2),
                    level: 'TARGET'
                });
            }
        });

        // Create chart
        const config = createChartConfig(inherentPoints, residualPoints, appetitePoints);
        
        try {
            const chart = new Chart(ctx, config);
            console.log('[ResidualRiskMatrixFix] Chart created successfully with', residualPoints.length, 'points');
            return chart;
        } catch (error) {
            console.error('[ResidualRiskMatrixFix] Error creating chart:', error);
            return null;
        }
    }

    /**
     * Fix existing chart by updating point sizes
     * @param {Chart} chart - Existing Chart.js instance
     */
    function fixExistingChart(chart) {
        if (!chart || !chart.data || !chart.data.datasets) return;

        chart.data.datasets.forEach((dataset, index) => {
            const label = (dataset.label || '').toLowerCase();
            
            if (label.includes('inherent')) {
                Object.assign(dataset, POINT_CONFIG.inherent);
            } else if (label.includes('residual')) {
                Object.assign(dataset, POINT_CONFIG.residual);
            } else if (label.includes('appetite')) {
                Object.assign(dataset, POINT_CONFIG.appetite);
            }
        });

        chart.update();
        console.log('[ResidualRiskMatrixFix] Existing chart updated with smaller icons');
    }

    /**
     * Auto-fix all residual risk charts on the page
     */
    function autoFixCharts() {
        // Find and fix the main matrix chart
        const matrixCanvas = document.getElementById('residual-risk-matrix');
        if (matrixCanvas) {
            const chart = Chart.getChart(matrixCanvas);
            if (chart) {
                fixExistingChart(chart);
            }
        }

        console.log('[ResidualRiskMatrixFix] Auto-fix completed');
    }

    /**
     * Initialize the fix module
     */
    function initialize() {
        console.log('[ResidualRiskMatrixFix] Initializing...');
        
        // Wait for charts to be created, then fix them
        setTimeout(autoFixCharts, 500);
        
        // Also set up observer for dynamically created charts
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const canvas = node.querySelector?.('#residual-risk-matrix') || 
                                       (node.id === 'residual-risk-matrix' ? node : null);
                        if (canvas) {
                            setTimeout(autoFixCharts, 200);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[ResidualRiskMatrixFix] Initialized successfully');
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Public API
    return {
        MATRIX_COLORS,
        POINT_CONFIG,
        getRiskZoneColor,
        createMatrixBackgroundPlugin,
        createChartConfig,
        initializeChart,
        fixExistingChart,
        autoFixCharts,
        initialize
    };
})();

// Make available globally
window.ResidualRiskMatrixFix = ResidualRiskMatrixFix;
