// Charts Module for Risk Register Graph
let printCharts = {
    inherent: null,
    residual: null,
    appetite: null
};

async function loadRiskRegisterGraph() {
    try {
        // Load all data
        const inherentData = await window.app.apiCall('/api/reports/risk-profile');
        const residualData = await window.app.apiCall('/api/reports/residual-risk');
        const appetiteData = await window.app.apiCall('/api/reports/risk-appetite-dashboard');

        // Create print charts
        createPrintInherentMatrix(inherentData);
        createPrintResidualMatrix(residualData);
        createPrintAppetiteDashboard(appetiteData);
    } catch (error) {
        console.error('Error loading risk register graph:', error);
    }
}

function createPrintInherentMatrix(data) {
    const ctx = document.getElementById('print-inherent-matrix');
    if (!ctx) return;

    if (printCharts.inherent) {
        printCharts.inherent.destroy();
    }

    const matrix = createRiskMatrix(data, 'inherent');

    printCharts.inherent = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Inherent Risk',
                data: matrix.points,
                backgroundColor: matrix.colors,
                borderColor: '#333',
                borderWidth: 1,
                pointRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0.5,
                    max: 5.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', 'Ringan Sekali', 'Ringan', 'Sedang', 'Berat', 'Sangat Berat'];
                            return labels[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Dampak (Impact)'
                    }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', 'Sangat Kecil', 'Kecil', 'Sedang', 'Besar', 'Sangat Besar'];
                            return labels[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Probabilitas (Probability)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createPrintResidualMatrix(data) {
    const ctx = document.getElementById('print-residual-matrix');
    if (!ctx) return;

    if (printCharts.residual) {
        printCharts.residual.destroy();
    }

    const matrix = createResidualRiskMatrix(data);

    printCharts.residual = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Residual Risk',
                data: matrix.points,
                backgroundColor: matrix.colors,
                borderColor: '#333',
                borderWidth: 1,
                pointRadius: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0.5,
                    max: 5.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', 'Ringan Sekali', 'Ringan', 'Sedang', 'Berat', 'Sangat Berat'];
                            return labels[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Dampak (Impact)'
                    }
                },
                y: {
                    min: 0.5,
                    max: 5.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const labels = ['', 'Sangat Kecil', 'Kecil', 'Sedang', 'Besar', 'Sangat Besar'];
                            return labels[value] || '';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Probabilitas (Probability)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createPrintAppetiteDashboard(data) {
    const ctx = document.getElementById('print-appetite-dashboard');
    if (!ctx) return;

    if (printCharts.appetite) {
        printCharts.appetite.destroy();
    }

    // Count by risk level
    const levelCounts = {
        'LOW RISK': 0,
        'MEDIUM RISK': 0,
        'HIGH RISK': 0,
        'EXTREME HIGH': 0
    };

    data.forEach(item => {
        const level = item.risk_appetite_level || 'LOW RISK';
        if (levelCounts[level] !== undefined) {
            levelCounts[level]++;
        }
    });

    printCharts.appetite = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(levelCounts),
            datasets: [{
                label: 'Jumlah Risiko',
                data: Object.values(levelCounts),
                backgroundColor: [
                    '#4CAF50',
                    '#FFC107',
                    '#FF9800',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Risk Appetite Distribution'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createRiskMatrix(data, type) {
    const points = [];
    const colors = [];

    data.forEach(item => {
        const probability = item.probability || 0;
        const impact = item.impact || 0;
        const riskValue = item.risk_value || 0;
        const riskLevel = item.risk_level || 'LOW RISK';

        points.push({
            x: impact,
            y: probability,
            value: riskValue,
            level: riskLevel
        });

        let color = '#4CAF50';
        if (riskLevel === 'EXTREME HIGH') color = '#F44336';
        else if (riskLevel === 'HIGH RISK') color = '#FF9800';
        else if (riskLevel === 'MEDIUM RISK') color = '#FFC107';

        colors.push(color);
    });

    return { points, colors };
}

function createResidualRiskMatrix(data) {
    return createRiskMatrix(data, 'residual');
}

// Make function available globally
window.loadRiskRegisterGraph = loadRiskRegisterGraph;

