/**
 * Residual Risk Matrix with Gradient Background
 * - Latar belakang gradasi warna sesuai tingkat risiko (hijau → merah)
 * - Badge reviewed dengan warna solid merah berkedip (< 1 bulan) dan hijau cerah (> 1 bulan)
 * - Icon yang lebih menarik di grafik
 */

(function() {
    'use strict';

    const GradientRiskMatrix = {
        // Gradient colors for risk zones
        zoneGradients: {
            low: {
                colors: ['rgba(16, 185, 129, 0.75)', 'rgba(5, 150, 105, 0.55)'],
                border: 'rgba(4, 120, 87, 0.9)',
                label: '#065F46',
                labelBg: 'rgba(255, 255, 255, 0.85)'
            },
            medium: {
                colors: ['rgba(245, 158, 11, 0.75)', 'rgba(217, 119, 6, 0.55)'],
                border: 'rgba(180, 83, 9, 0.9)',
                label: '#92400E',
                labelBg: 'rgba(255, 255, 255, 0.85)'
            },
            high: {
                colors: ['rgba(249, 115, 22, 0.8)', 'rgba(234, 88, 12, 0.6)'],
                border: 'rgba(194, 65, 12, 0.9)',
                label: '#9A3412',
                labelBg: 'rgba(255, 255, 255, 0.85)'
            },
            extreme: {
                colors: ['rgba(239, 68, 68, 0.85)', 'rgba(220, 38, 38, 0.65)'],
                border: 'rgba(153, 27, 27, 0.95)',
                label: '#7F1D1D',
                labelBg: 'rgba(255, 255, 255, 0.9)'
            }
        },

        // Modern point styles with better icons
        pointStyles: {
            inherent: {
                backgroundColor: '#00E5FF',
                borderColor: '#006064',
                borderWidth: 3,
                pointRadius: 10,
                pointHoverRadius: 14,
                pointStyle: 'rectRot', // Diamond shape
                hoverBackgroundColor: '#00B8D4',
                hoverBorderColor: '#004D40',
                hoverBorderWidth: 4
            },
            residual: {
                backgroundColor: '#FFD700',
                borderColor: '#FF6F00',
                borderWidth: 3,
                pointRadius: 12,
                pointHoverRadius: 16,
                pointStyle: 'star',
                hoverBackgroundColor: '#FFA000',
                hoverBorderColor: '#E65100',
                hoverBorderWidth: 4
            },
            appetite: {
                backgroundColor: '#FFFFFF',
                borderColor: '#374151',
                borderWidth: 3,
                pointRadius: 10,
                pointHoverRadius: 14,
                pointStyle: 'triangle',
                hoverBackgroundColor: '#F3F4F6',
                hoverBorderColor: '#1F2937',
                hoverBorderWidth: 4
            }
        },

        /**
         * Create gradient background plugin for Chart.js
         */
        createGradientBackgroundPlugin: function() {
            const self = this;
            
            return {
                id: 'gradientRiskMatrixBackground',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const chartArea = chart.chartArea;
                    
                    if (!chartArea) return;
                    
                    ctx.save();
                    
                    // Define risk zones with gradient backgrounds
                    const zones = [
                        // Green zones (Low Risk) - Bottom left area
                        { xMin: 0.5, xMax: 1.5, yMin: 0.5, yMax: 5.5, zone: 'low' },
                        { xMin: 1.5, xMax: 2.5, yMin: 0.5, yMax: 2.5, zone: 'low' },
                        
                        // Yellow zones (Medium Risk)
                        { xMin: 1.5, xMax: 2.5, yMin: 2.5, yMax: 3.5, zone: 'medium' },
                        { xMin: 2.5, xMax: 3.5, yMin: 0.5, yMax: 2.5, zone: 'medium' },
                        
                        // Orange zones (High Risk)
                        { xMin: 1.5, xMax: 2.5, yMin: 3.5, yMax: 5.5, zone: 'high' },
                        { xMin: 2.5, xMax: 3.5, yMin: 2.5, yMax: 4.5, zone: 'high' },
                        { xMin: 3.5, xMax: 5.5, yMin: 0.5, yMax: 2.5, zone: 'high' },
                        
                        // Red zones (Extreme Risk) - Top right area
                        { xMin: 2.5, xMax: 3.5, yMin: 4.5, yMax: 5.5, zone: 'extreme' },
                        { xMin: 3.5, xMax: 5.5, yMin: 2.5, yMax: 5.5, zone: 'extreme' }
                    ];
                    
                    // Draw each zone with gradient
                    zones.forEach(zoneConfig => {
                        const xStart = chart.scales.x.getPixelForValue(zoneConfig.xMin);
                        const xEnd = chart.scales.x.getPixelForValue(zoneConfig.xMax);
                        const yStart = chart.scales.y.getPixelForValue(zoneConfig.yMax);
                        const yEnd = chart.scales.y.getPixelForValue(zoneConfig.yMin);
                        
                        const zoneStyle = self.zoneGradients[zoneConfig.zone];
                        
                        // Create diagonal gradient
                        const gradient = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
                        gradient.addColorStop(0, zoneStyle.colors[0]);
                        gradient.addColorStop(1, zoneStyle.colors[1]);
                        
                        // Fill with gradient
                        ctx.fillStyle = gradient;
                        ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart);
                        
                        // Draw border
                        ctx.strokeStyle = zoneStyle.border;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(xStart, yStart, xEnd - xStart, yEnd - yStart);
                    });
                    
                    // Draw zone labels
                    const labelZones = [
                        { x: 1, y: 3, label: 'LOW', zone: 'low' },
                        { x: 2, y: 1.5, label: 'LOW', zone: 'low' },
                        { x: 2, y: 3, label: 'MEDIUM', zone: 'medium' },
                        { x: 3, y: 1.5, label: 'MEDIUM', zone: 'medium' },
                        { x: 2, y: 4.5, label: 'HIGH', zone: 'high' },
                        { x: 3, y: 3.5, label: 'HIGH', zone: 'high' },
                        { x: 4.5, y: 1.5, label: 'HIGH', zone: 'high' },
                        { x: 3, y: 5, label: 'EXTREME', zone: 'extreme' },
                        { x: 4.5, y: 4, label: 'EXTREME', zone: 'extreme' }
                    ];
                    
                    labelZones.forEach(labelConfig => {
                        const x = chart.scales.x.getPixelForValue(labelConfig.x);
                        const y = chart.scales.y.getPixelForValue(labelConfig.y);
                        const zoneStyle = self.zoneGradients[labelConfig.zone];
                        
                        // Draw label background
                        ctx.font = 'bold 11px Arial';
                        const textWidth = ctx.measureText(labelConfig.label).width;
                        
                        ctx.fillStyle = zoneStyle.labelBg;
                        ctx.beginPath();
                        ctx.roundRect(x - textWidth/2 - 6, y - 8, textWidth + 12, 18, 4);
                        ctx.fill();
                        
                        // Draw label text
                        ctx.fillStyle = zoneStyle.label;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(labelConfig.label, x, y);
                    });
                    
                    ctx.restore();
                }
            };
        },

        /**
         * Get chart configuration with gradient background
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
                            label: 'Residual Risk Rating ★',
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
                    animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            min: 0.5,
                            max: 5.5,
                            ticks: {
                                stepSize: 1,
                                font: { size: 11, weight: 'bold' },
                                color: '#374151',
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
                                font: { weight: 'bold', size: 13 },
                                color: '#1F2937',
                                padding: { top: 10 }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.08)',
                                lineWidth: 1
                            }
                        },
                        y: {
                            min: 0.5,
                            max: 5.5,
                            ticks: {
                                stepSize: 1,
                                font: { size: 11, weight: 'bold' },
                                color: '#374151',
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
                                font: { weight: 'bold', size: 13 },
                                color: '#1F2937',
                                padding: { bottom: 10 }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.08)',
                                lineWidth: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12, weight: '600' },
                                color: '#374151'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 14,
                            cornerRadius: 10,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    return context[0].dataset.label;
                                },
                                label: function(context) {
                                    const point = context.raw;
                                    return [
                                        `📋 Kode: ${point.riskId || 'N/A'}`,
                                        `📊 Risk Value: ${point.value || 0}`,
                                        `🎯 Level: ${point.level || 'N/A'}`,
                                        `💥 Dampak: ${point.x}`,
                                        `📈 Probabilitas: ${point.y}`
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
                plugins: [this.createGradientBackgroundPlugin()]
            };
        },

        /**
         * Prepare chart data from risk data
         */
        prepareChartData: function(data) {
            const inherentPoints = [];
            const residualPoints = [];
            const appetitePoints = [];

            if (!Array.isArray(data)) {
                console.warn('[GradientRiskMatrix] Invalid data format');
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

                    // Add risk appetite point
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
         * Render the gradient matrix chart
         */
        render: function(canvasId, data) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error('[GradientRiskMatrix] Canvas not found:', canvasId);
                return null;
            }

            if (typeof Chart === 'undefined') {
                console.error('[GradientRiskMatrix] Chart.js not loaded');
                return null;
            }

            // Destroy existing chart
            const existingChart = Chart.getChart(canvas);
            if (existingChart) {
                existingChart.destroy();
            }

            const config = this.getChartConfig(data);
            
            try {
                const chart = new Chart(canvas, config);
                console.log('[GradientRiskMatrix] Chart rendered with gradient background');
                return chart;
            } catch (error) {
                console.error('[GradientRiskMatrix] Error rendering chart:', error);
                return null;
            }
        },

        /**
         * Update chart with new data
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
    window.GradientRiskMatrix = GradientRiskMatrix;

    console.log('[GradientRiskMatrix] Module loaded');

})();
