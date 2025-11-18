// Risk Profile Module
let inherentRiskChart = null;

async function loadRiskProfile() {
    try {
        const data = await window.app.apiCall('/api/reports/risk-profile');
        displayInherentRiskMatrix(data);
        displayInherentRiskTable(data);
    } catch (error) {
        console.error('Error loading risk profile:', error);
    }
}

function displayInherentRiskMatrix(data) {
    const ctx = document.getElementById('inherent-risk-matrix');
    if (!ctx) return;

    // Destroy existing chart
    if (inherentRiskChart) {
        inherentRiskChart.destroy();
    }

    // Create 5x5 matrix data
    const matrix = createRiskMatrix(data, 'inherent');

    // Create chart
    inherentRiskChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Inherent Risk',
                data: matrix.points,
                backgroundColor: matrix.colors,
                borderColor: '#333',
                borderWidth: 1,
                pointRadius: 15,
                pointHoverRadius: 18
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `Risk ID: ${point.riskId || 'N/A'}, Value: ${point.value || 'N/A'}, Level: ${point.level || 'N/A'}`;
                        }
                    }
                }
            }
        }
    });

    // Add colored background cells
    addMatrixBackground(ctx, inherentRiskChart);
}

function displayInherentRiskTable(data) {
    const container = document.getElementById('inherent-risk-table');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p>Tidak ada data inherent risk.</p>';
        return;
    }

    let html = `
        <h3>Inherent Risk Analysis</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Kode Risiko</th>
                    <th>Probabilitas</th>
                    <th>Dampak</th>
                    <th>Nilai Risiko</th>
                    <th>Tingkat Risiko</th>
                    <th>Probabilitas %</th>
                    <th>Dampak Finansial</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        const risk = item.risk_inputs;
        html += `
            <tr>
                <td>${risk?.kode_risiko || '-'}</td>
                <td>${item.probability || '-'}</td>
                <td>${item.impact || '-'}</td>
                <td>${item.risk_value || '-'}</td>
                <td><span class="risk-${item.risk_level?.toLowerCase().replace(' ', '-')}">${item.risk_level || '-'}</span></td>
                <td>${item.probability_percentage || '-'}</td>
                <td>Rp ${formatNumber(item.financial_impact || 0)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function createRiskMatrix(data, type) {
    const points = [];
    const colors = [];

    data.forEach(item => {
        const probability = item.probability || 0;
        const impact = item.impact || 0;
        const riskValue = item.risk_value || 0;
        const riskLevel = item.risk_level || 'LOW RISK';
        const riskId = item.risk_inputs?.kode_risiko || 'N/A';

        points.push({
            x: impact,
            y: probability,
            riskId: riskId,
            value: riskValue,
            level: riskLevel
        });

        // Determine color based on risk level
        let color = '#4CAF50'; // green
        if (riskLevel === 'EXTREME HIGH') color = '#F44336'; // red
        else if (riskLevel === 'HIGH RISK') color = '#FF9800'; // orange
        else if (riskLevel === 'MEDIUM RISK') color = '#FFC107'; // yellow

        colors.push(color);
    });

    return { points, colors };
}

function addMatrixBackground(canvas, chart) {
    // This would require custom drawing on canvas
    // For now, we'll rely on Chart.js scatter plot
}

function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Make function available globally
window.loadRiskProfile = loadRiskProfile;

