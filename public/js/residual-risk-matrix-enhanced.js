/**
 * Enhanced Residual Risk Matrix Chart
 * - Warna lebih cerah dan solid
 * - Icon lebih kecil dan tampil sempurna
 * - Improved visibility dan readability
 */

(function() {
    'use strict';

    const EnhancedRiskMatrix = {
        // Bright solid colors for risk zones
        zoneColors: {
            low: {
                fill: 'rgba(16, 185, 129, 0.5)',      // Bright green
                border: 'rgba(5, 150, 105, 0.8)',
                label: '#065F46'
            },
            medium: {
                fill: 'rgba(245, 158, 11, 0.5)',      // Bright amber
                border: 'rgba(217, 119, 6, 0.8)',
                label: '#92400E'
            },
            high: {
                fill: 'rgba(249, 115, 22, 0.5)',      // Bright orange
                border: 'rgba(234, 88, 12, 0.8)',
                label: '#9A3412'
            },
            extreme: {
                fill: 'rgba(239, 68, 68, 0.55)',      // Bright red
                border: 'rgba(220, 38, 38, 0.85)',
                label: '#991B1B'
            }
        },

        // Point styles configuration - smaller icons
        pointStyles: {
            inherent: {
                backgroundColor: '#00E5FF',           // Bright cyan
                borderColor: '#000000',
                borderWidth: 2,
                pointRadius: 8,                       // Smaller
                pointHoverRadius: 10,
                pointStyle: 'circle'
            },
            residual: {
                backgroundColor: '#FFD700',           // Bright gold
                borderColor: '#000000',
                borderWidth: 2,
                pointRadius: 10,                      // Smaller star
                pointHoverRadius: 12,
                pointStyle: 'star'
            },
            appetite: {
                backgroundColor: '#FFFFFF',
                borderColor: '#000000',
                borderWidth: 2,
                pointRadius: 8,                       // Smaller
                pointHoverRadius: 10,
                pointStyle: 'triangle'
            }
        },

        /**
         * Create enhanced risk matrix background plugin
         */
        createBackgroundPlugin: function() {
            const self = this;
            
            return {
                id: 'enhancedRiskMatrixBackground',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const chartArea = chart.chartArea;
                    
                    if (!chartArea) return;
                    
                    ctx.save();
                    
                    // Define risk zones with bright solid colors
                    const zones = [
                        // Green zones (Low Risk) - Bright green
                        { xMin: 0.5, xMax: 1.5, yMin: 0.5, yMax: 5.5, color: self.zoneColors.low, label: 'LOW' },
                        { xMin: 1.5, xMax: 2.5, yMin: 0.5, yMax: 2.5, color: self.zoneColors.low, label: 'LOW' },
                        
                        // Yellow zones (Medium Risk) - Bright amber
                        { xMin: 1.5, xMax: 2.5, yMin: 2.5, yMax: 3.5, color: self.zoneColors.medium, label: 'MEDIUM' },
                        { xMin: 2.5, xMax: 3.5, yMin: 0.5, yMax: 2.5, color: self.zoneColors.medium, label: 'MEDIUM' },
                        
                        // Orange zones (High Risk) - Bright orange
                        { xMin: 1.5, xMax: 2.5, yMin: 3.5, yMax: 5.5, color: self.zoneColors.high, label: 'HIGH' },
                        { xMin: 2.5, xMax: 3.5, yMin: 2.5, yMax: 4.5, color: self.zoneColors.high, label: 'HIGH' },
                        { xMin: 3.5, xMax: 5.5, yMin: 0.5, yMax: 2.5, color: self.zoneColors.high, label: 'HIGH' },
                        
                        // Red zones (Extreme Risk) - Bright red
                        { xMin: 2.5, xMax: 3.5, yMin: 4.5, yMax: 5.5, color: self.zoneColors.extreme, label: 'EXTREME' },
                        { xMin: 3.5, xMax: 5.5, yMin: 2.5, yMax: 5.5, color: self.zoneColors.extreme, label: 'EXTREME' }
                    ];
                    
                    // Draw background zones
                    zones.forEach(zone => {
                        const xStart = chart.scales.x.getPixelForValue(zone.xMin);
                        const xEnd = chart.scales.x.getPixelForValue(zone.xMax);
                        const yStart = chart.scales.y.getPixelForValue(zone.yMax);
                        const yEnd = chart.scales.y.getPixelForValue(zone.yMin);
                        
                        // Fill background
                        ctx.fillStyle = zone.color.fill;
                        ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart);
                        
                        // Draw border
                        ctx.strokeStyle = zone.color.border;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(xStart, yStart, xEnd - xStart, yEnd - yStart);
                        
                        // Add zone label
                        const centerX = (xStart + xEnd) / 2;
                        const centerY = (yStart + yEnd) / 2;
                        
                        ctx.fillStyle = zone.color.label;
                        ctx.font = 'bold 11px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(zone.label, centerX, centerY);
                    });
                    
                    ctx.restore();
                }
            };
        },

        /**
         * Get enhanced chart configuration
         * @param {Array} data - Risk data array
         * @returns {Object} Chart.js configuration
         */
        getChartConfig: function(data) {
            const self = this;
            const { inherentPoints, residualPoints, appetitePoints } = this.prepareChartData(data);
            
            return {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Inherent Risk Rating',
                            data: inherentPoints,
                            ...self.pointStyles.inherent
                        },
                        {
                            label: 'Residual Risk Rating (★)',
                            data: residualPoints,
                            ...self.pointStyles.residual
                        },
                        {
                            label: 'Risk Appetite',
                            data: appetitePoints,
                            ...self.pointStyles.appetite
                        }
                    ]
                },
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
                                font: { size: 10, weight: 'bold' },
                                callback: function(value) {
                                    const labels = {
                                        1: '1-Ringan Sekali',
                                        2: '2-Ringan',
                                        3: '3-Sedang',
                                        4: '4-Berat',
                                        5: '5-Sangat Berat'
                                    };
                                    return labels[value] || '';
                                }
                            },
                            title: {
                                display: true,
                                text: 'DAMPAK',
                                font: { weight: 'bold', size: 12 },
                                color: '#1F2937'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                lineWidth: 1
                            }
                        },
                        y: {
                            min: 0.5,
                            max: 5.5,
                            ticks: {
                                stepSize: 1,
                                font: { size: 10, weight: 'bold' },
                                callback: function(value) {
                                    const labels = {
                                        1: '1-≤10%',
                                        2: '2-10-40%',
                                        3: '3-40-60%',
                                        4: '4-60-80%',
                                        5: '5->80%'
                                    };
                                    return labels[value] || '';
                                }
                            },
                            title: {
                                display: true,
                                text: 'PROBABILITAS',
                                font: { weight: 'bold', size: 12 },
                                color: '#1F2937'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                lineWidth: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 11, weight: '500' },
                                generateLabels: function(chart) {
                                    return [
                                        {
                                            text: 'Inherent Risk Rating',
                                            fillStyle: '#00E5FF',
                                            strokeStyle: '#000000',
                                            lineWidth: 2,
                                            pointStyle: 'circle'
                                        },
                                        {
                                            text: 'Residual Risk Rating (★)',
                                            fillStyle: '#FFD700',
                                            strokeStyle: '#000000',
                                            lineWidth: 2,
                                            pointStyle: 'star'
                                        },
                                        {
                                            text: 'Risk Appetite',
                                            fillStyle: '#FFFFFF',
                                            strokeStyle: '#000000',
                                            lineWidth: 2,
                                            pointStyle: 'triangle'
                                        }
                                    ];
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            titleFont: { size: 12, weight: 'bold' },
                            bodyFont: { size: 11 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                title: function(context) {
                                    return context[0].dataset.label;
                                },
                                label: function(context) {
                                    const point = context.raw;
                                    return [
                                        `Kode: ${point.riskId || 'N/A'}`,
                                        `Risk Value: ${point.value || 0}`,
                                        `Level: ${point.level || 'N/A'}`,
                                        `Impact: ${point.x}`,
                                        `Probability: ${point.y}`
                                    ];
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'point'
                    }
                },
                plugins: [this.createBackgroundPlugin()]
            };
        },

        /**
         * Prepare chart data from risk data
         * @param {Array} data - Risk data array
         * @returns {Object} Prepared chart data
         */
        prepareChartData: function(data) {
            const inherentPoints = [];
            const residualPoints = [];
            const appetitePoints = [];

            if (!Array.isArray(data)) {
                console.warn('[EnhancedRiskMatrix] Invalid data format');
                return { inherentPoints, residualPoints, appetitePoints };
            }

            data.forEach(item => {
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

                const residualX = parseFloat(item.impact) || 0;
                const residualY = parseFloat(item.probability) || 0;
                const residualValue = parseFloat(item.risk_value) || 0;

                if (residualX > 0 && residualY > 0) {
                    // Add residual point
                    residualPoints.push({
                        x: residualX,
                        y: residualY,
                        riskId: risk.kode_risiko || 'N/A',
                        value: residualValue,
                        level: item.risk_level || 'UNKNOWN'
                    });

                    // Add inherent point if available
                    const inherentValue = parseFloat(inherent.risk_value) || 0;
                    if (inherentValue > 0) {
                        inherentPoints.push({
                            x: parseFloat(inherent.impact) || residualX,
                            y: parseFloat(inherent.probability) || residualY,
                            riskId: risk.kode_risiko || 'N/A',
                            value: inherentValue,
                            level: inherent.risk_level || 'UNKNOWN'
                        });
                    }

                    // Add risk appetite point (target lower risk)
                    appetitePoints.push({
                        x: Math.max(1, residualX - 1),
                        y: Math.max(1, residualY - 1),
                        riskId: risk.kode_risiko || 'N/A',
                        value: Math.max(1, residualValue - 2),
                        level: 'TARGET'
                    });
                }
            });

            return { inherentPoints, residualPoints, appetitePoints };
        },

        /**
         * Render enhanced matrix chart
         * @param {string} canvasId - Canvas element ID
         * @param {Array} data - Risk data array
         * @returns {Chart} Chart instance
         */
        render: function(canvasId, data) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error('[EnhancedRiskMatrix] Canvas not found:', canvasId);
                return null;
            }

            if (typeof Chart === 'undefined') {
                console.error('[EnhancedRiskMatrix] Chart.js not loaded');
                return null;
            }

            // Destroy existing chart if any
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }

            const config = this.getChartConfig(data);
            
            try {
                const chart = new Chart(canvas, config);
                console.log('[EnhancedRiskMatrix] Chart rendered successfully');
                return chart;
            } catch (error) {
                console.error('[EnhancedRiskMatrix] Error rendering chart:', error);
                return null;
            }
        },

        /**
         * Update existing chart with new data
         * @param {Chart} chart - Existing chart instance
         * @param {Array} data - New risk data
         */
        update: function(chart, data) {
            if (!chart) return;

            const { inherentPoints, residualPoints, appetitePoints } = this.prepareChartData(data);
            
            chart.data.datasets[0].data = inherentPoints;
            chart.data.datasets[1].data = residualPoints;
            chart.data.datasets[2].data = appetitePoints;
            
            chart.update('none');
        }
    };

    // Expose globally
    window.EnhancedRiskMatrix = EnhancedRiskMatrix;

    // Auto-enhance existing charts when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[EnhancedRiskMatrix] Module loaded and ready');
    });

})();
