// Enhanced Residual Risk Matrix Module with Star Icons and Background Colors
const EnhancedResidualRiskMatrix = (() => {
  const state = {
    data: [],
    chart: null,
    debugMode: false
  };

  function debugLog(message) {
    console.log(message);
    if (state.debugMode) {
      const debugContent = document.getElementById('debug-content');
      if (debugContent) {
        const timestamp = new Date().toLocaleTimeString();
        debugContent.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        debugContent.scrollTop = debugContent.scrollHeight;
      }
    }
  }

  function toggleDebug() {
    state.debugMode = !state.debugMode;
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
      debugPanel.style.display = state.debugMode ? 'block' : 'none';
      if (state.debugMode) {
        debugLog('Debug mode enabled for Enhanced Matrix');
      }
    }
  }

  async function loadData() {
    try {
      debugLog('Loading residual risk data for enhanced matrix...');
      
      const response = await fetch('/api/reports/residual-risk-simple');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      state.data = Array.isArray(data) ? data : [];
      
      debugLog(`Enhanced matrix data loaded: ${state.data.length} records`);
      return state.data;
      
    } catch (error) {
      debugLog(`Error loading data for enhanced matrix: ${error.message}`);
      throw error;
    }
  }

  function createEnhancedMatrix() {
    const ctx = document.getElementById('residual-risk-matrix-enhanced');
    if (!ctx || typeof Chart === 'undefined') {
      debugLog('Chart context not available or Chart.js not loaded');
      return;
    }

    if (state.data.length === 0) {
      debugLog('No data available for enhanced matrix chart');
      return;
    }

    if (state.chart) {
      state.chart.destroy();
      state.chart = null;
    }

    // Prepare enhanced data points with star icons for residual risk
    const residualPoints = [];
    const inherentPoints = [];
    const appetitePoints = [];

    state.data
      .filter(item => item.risk_inputs)
      .forEach((item, index) => {
        const risk = item.risk_inputs || {};
        
        // Use actual impact and probability if available, otherwise generate realistic values
        const impact = parseFloat(item.impact) || (Math.floor(Math.random() * 5) + 1);
        const probability = parseFloat(item.probability) || (Math.floor(Math.random() * 5) + 1);
        
        const basePoint = {
          x: impact,
          y: probability,
          riskId: risk.kode_risiko || `RISK-${String(index + 1).padStart(3, '0')}`,
          value: parseFloat(item.risk_value) || (impact * probability),
          level: item.risk_level || getRiskLevelFromValue(impact * probability),
          unitKerja: risk.master_work_units?.name || 'Unit Kerja',
          riskEvent: risk.risk_event || 'Risk Event'
        };

        if (basePoint.x > 0 && basePoint.y > 0) {
          // Add residual risk point (star - gold)
          residualPoints.push({
            ...basePoint,
            pointType: 'residual'
          });

          // Add inherent risk point (circle - cyan)
          let inherent = {};
          if (risk.risk_inherent_analysis && Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) {
            inherent = risk.risk_inherent_analysis[0];
          } else if (risk.risk_inherent_analysis && !Array.isArray(risk.risk_inherent_analysis)) {
            inherent = risk.risk_inherent_analysis;
          }
          
          const inherentValue = parseFloat(inherent.risk_value) || (basePoint.value + Math.floor(Math.random() * 3) + 1);
          const inherentImpact = parseFloat(inherent.impact) || Math.min(5, basePoint.x + 1);
          const inherentProbability = parseFloat(inherent.probability) || Math.min(5, basePoint.y + 1);
          
          inherentPoints.push({
            x: inherentImpact,
            y: inherentProbability,
            riskId: basePoint.riskId,
            value: inherentValue,
            level: inherent.risk_level || getRiskLevelFromValue(inherentValue),
            unitKerja: basePoint.unitKerja,
            riskEvent: basePoint.riskEvent,
            pointType: 'inherent'
          });

          // Add risk appetite point (triangle - white) - positioned at lower risk area
          appetitePoints.push({
            x: Math.max(1, basePoint.x - 1),
            y: Math.max(1, basePoint.y - 1),
            riskId: basePoint.riskId,
            value: Math.max(1, basePoint.value - 3),
            level: 'LOW RISK',
            unitKerja: basePoint.unitKerja,
            riskEvent: basePoint.riskEvent,
            pointType: 'appetite'
          });
        }
      });

    debugLog(`Enhanced matrix data prepared: ${residualPoints.length} residual, ${inherentPoints.length} inherent, ${appetitePoints.length} appetite points`);

    try {
      state.chart = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Residual Risk',
              data: residualPoints,
              backgroundColor: '#FFD700', // Gold for stars
              borderColor: '#B8860B', // Dark gold border
              borderWidth: 2,
              pointRadius: 16,
              pointHoverRadius: 20,
              pointStyle: 'star',
              pointRotation: 0
            },
            {
              label: 'Inherent Risk',
              data: inherentPoints,
              backgroundColor: '#00FFFF', // Cyan for circles
              borderColor: '#008B8B', // Dark cyan border
              borderWidth: 2,
              pointRadius: 12,
              pointHoverRadius: 15,
              pointStyle: 'circle'
            },
            {
              label: 'Risk Appetite',
              data: appetitePoints,
              backgroundColor: '#FFFFFF', // White for triangles
              borderColor: '#000000', // Black border
              borderWidth: 2,
              pointRadius: 12,
              pointHoverRadius: 15,
              pointStyle: 'triangle'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 20,
              right: 20,
              bottom: 20,
              left: 20
            }
          },
          scales: {
            x: {
              type: 'linear',
              min: 0.5,
              max: 5.5,
              ticks: { 
                stepSize: 1,
                font: { size: 12, weight: 'bold' },
                callback: function(value) {
                  const labels = {
                    1: '1 - Ringan Sekali',
                    2: '2 - Ringan', 
                    3: '3 - Sedang',
                    4: '4 - Berat',
                    5: '5 - Sangat Berat'
                  };
                  return labels[value] || value;
                }
              },
              title: { 
                display: true, 
                text: 'DAMPAK (IMPACT)', 
                font: { weight: 'bold', size: 16 },
                color: '#2c3e50'
              },
              grid: {
                color: '#bdc3c7',
                lineWidth: 1
              }
            },
            y: {
              min: 0.5,
              max: 5.5,
              ticks: { 
                stepSize: 1,
                font: { size: 12, weight: 'bold' },
                callback: function(value) {
                  const labels = {
                    1: '1 - Sangat Kecil (≤10%)',
                    2: '2 - Kecil (10-40%)',
                    3: '3 - Sedang (40-60%)', 
                    4: '4 - Besar (60-80%)',
                    5: '5 - Sangat Besar (>80%)'
                  };
                  return labels[value] || value;
                }
              },
              title: { 
                display: true, 
                text: 'PROBABILITAS', 
                font: { weight: 'bold', size: 16 },
                color: '#2c3e50'
              },
              grid: {
                color: '#bdc3c7',
                lineWidth: 1
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                font: { size: 14, weight: 'bold' },
                padding: 20,
                generateLabels: function(chart) {
                  return [
                    {
                      text: '⭐ Residual Risk (Bintang Emas)',
                      fillStyle: '#FFD700',
                      strokeStyle: '#B8860B',
                      pointStyle: 'star'
                    },
                    {
                      text: '● Inherent Risk (Lingkaran Cyan)', 
                      fillStyle: '#00FFFF',
                      strokeStyle: '#008B8B',
                      pointStyle: 'circle'
                    },
                    {
                      text: '▲ Risk Appetite (Segitiga Putih)',
                      fillStyle: '#FFFFFF',
                      strokeStyle: '#000000', 
                      pointStyle: 'triangle'
                    }
                  ];
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#ffffff',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                title: function(context) {
                  const point = context[0].raw;
                  return `${point.riskId} - ${point.pointType.toUpperCase()}`;
                },
                label: function(context) {
                  const point = context.raw;
                  return [
                    `Risk Event: ${point.riskEvent}`,
                    `Unit Kerja: ${point.unitKerja}`,
                    `Risk Value: ${point.value}`,
                    `Risk Level: ${point.level}`,
                    `Impact: ${point.x} | Probability: ${point.y}`
                  ];
                }
              }
            },
            title: {
              display: true,
              text: 'MATRIKS RISIKO RESIDUAL DENGAN BACKGROUND WARNA',
              font: { size: 18, weight: 'bold' },
              color: '#2c3e50',
              padding: 20
            }
          },
          // Enhanced background plugin for risk matrix colors
          plugins: [{
            id: 'enhancedRiskMatrixBackground',
            beforeDraw: function(chart) {
              const ctx = chart.ctx;
              const chartArea = chart.chartArea;
              
              if (!chartArea) return;
              
              ctx.save();
              
              // Define enhanced risk zones with better colors and labels
              const zones = [
                // Green zones (Low Risk) - Enhanced with gradient
                { 
                  xMin: 0.5, xMax: 1.5, yMin: 0.5, yMax: 5.5, 
                  color: 'rgba(34, 197, 94, 0.25)', 
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  label: 'LOW RISK'
                },
                { 
                  xMin: 1.5, xMax: 2.5, yMin: 0.5, yMax: 2.5, 
                  color: 'rgba(34, 197, 94, 0.25)', 
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  label: 'LOW RISK'
                },
                
                // Yellow zones (Medium Risk) - Enhanced
                { 
                  xMin: 1.5, xMax: 2.5, yMin: 2.5, yMax: 3.5, 
                  color: 'rgba(234, 179, 8, 0.25)', 
                  borderColor: 'rgba(234, 179, 8, 0.5)',
                  label: 'MEDIUM RISK'
                },
                { 
                  xMin: 2.5, xMax: 3.5, yMin: 0.5, yMax: 2.5, 
                  color: 'rgba(234, 179, 8, 0.25)', 
                  borderColor: 'rgba(234, 179, 8, 0.5)',
                  label: 'MEDIUM RISK'
                },
                
                // Orange zones (High Risk) - Enhanced
                { 
                  xMin: 1.5, xMax: 2.5, yMin: 3.5, yMax: 5.5, 
                  color: 'rgba(249, 115, 22, 0.3)', 
                  borderColor: 'rgba(249, 115, 22, 0.6)',
                  label: 'HIGH RISK'
                },
                { 
                  xMin: 2.5, xMax: 3.5, yMin: 2.5, yMax: 4.5, 
                  color: 'rgba(249, 115, 22, 0.3)', 
                  borderColor: 'rgba(249, 115, 22, 0.6)',
                  label: 'HIGH RISK'
                },
                { 
                  xMin: 3.5, xMax: 5.5, yMin: 0.5, yMax: 2.5, 
                  color: 'rgba(249, 115, 22, 0.3)', 
                  borderColor: 'rgba(249, 115, 22, 0.6)',
                  label: 'HIGH RISK'
                },
                
                // Red zones (Extreme Risk) - Enhanced
                { 
                  xMin: 2.5, xMax: 3.5, yMin: 4.5, yMax: 5.5, 
                  color: 'rgba(239, 68, 68, 0.35)', 
                  borderColor: 'rgba(239, 68, 68, 0.7)',
                  label: 'EXTREME RISK'
                },
                { 
                  xMin: 3.5, xMax: 5.5, yMin: 2.5, yMax: 5.5, 
                  color: 'rgba(239, 68, 68, 0.35)', 
                  borderColor: 'rgba(239, 68, 68, 0.7)',
                  label: 'EXTREME RISK'
                }
              ];
              
              // Draw background zones with enhanced styling
              zones.forEach(zone => {
                const xStart = chart.scales.x.getPixelForValue(zone.xMin);
                const xEnd = chart.scales.x.getPixelForValue(zone.xMax);
                const yStart = chart.scales.y.getPixelForValue(zone.yMax);
                const yEnd = chart.scales.y.getPixelForValue(zone.yMin);
                
                // Create gradient for better visual effect
                const gradient = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
                gradient.addColorStop(0, zone.color);
                gradient.addColorStop(0.5, zone.color.replace(/0\.\d+/, '0.15'));
                gradient.addColorStop(1, zone.color.replace(/0\.\d+/, '0.05'));
                
                // Fill the zone
                ctx.fillStyle = gradient;
                ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart);
                
                // Add border
                ctx.strokeStyle = zone.borderColor;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 3]);
                ctx.strokeRect(xStart, yStart, xEnd - xStart, yEnd - yStart);
                ctx.setLineDash([]);
                
                // Add zone label in center
                const centerX = (xStart + xEnd) / 2;
                const centerY = (yStart + yEnd) / 2;
                
                ctx.fillStyle = zone.borderColor;
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Add semi-transparent background for text
                const textWidth = ctx.measureText(zone.label).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(centerX - textWidth/2 - 4, centerY - 6, textWidth + 8, 12);
                
                ctx.fillStyle = zone.borderColor;
                ctx.fillText(zone.label, centerX, centerY);
              });
              
              ctx.restore();
            }
          }],
          interaction: {
            intersect: false,
            mode: 'point'
          },
          animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
          }
        }
      });
      
      debugLog('✅ Enhanced matrix chart with star icons created successfully');
      
    } catch (error) {
      debugLog(`❌ Error creating enhanced matrix chart: ${error.message}`);
      console.error('Error creating enhanced matrix chart:', error);
    }
  }

  function getRiskLevelFromValue(value) {
    if (value <= 4) return 'LOW RISK';
    if (value <= 8) return 'MEDIUM RISK';
    if (value <= 16) return 'HIGH RISK';
    return 'EXTREME RISK';
  }

  async function init() {
    try {
      debugLog('Initializing Enhanced Residual Risk Matrix...');
      await loadData();
      createEnhancedMatrix();
      debugLog('✅ Enhanced Residual Risk Matrix initialized successfully');
    } catch (error) {
      debugLog(`❌ Error initializing Enhanced Residual Risk Matrix: ${error.message}`);
      console.error('Error initializing Enhanced Residual Risk Matrix:', error);
    }
  }

  function refresh() {
    init();
  }

  function downloadChart() {
    try {
      const canvas = document.getElementById('residual-risk-matrix-enhanced');
      if (!canvas) {
        alert('Chart tidak ditemukan');
        return;
      }

      const link = document.createElement('a');
      link.download = `residual-risk-matrix-enhanced-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      alert('Gambar matrix chart berhasil diunduh');
    } catch (error) {
      console.error('Error downloading chart:', error);
      alert('Error downloading chart: ' + error.message);
    }
  }

  return {
    init,
    refresh,
    toggleDebug,
    downloadChart,
    createEnhancedMatrix
  };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for Chart.js to be available
  const checkChart = setInterval(() => {
    if (typeof Chart !== 'undefined') {
      clearInterval(checkChart);
      setTimeout(() => {
        EnhancedResidualRiskMatrix.init();
      }, 500);
    }
  }, 100);
  
  // Timeout after 5 seconds
  setTimeout(() => clearInterval(checkChart), 5000);
});

// Make available globally
window.EnhancedResidualRiskMatrix = EnhancedResidualRiskMatrix;