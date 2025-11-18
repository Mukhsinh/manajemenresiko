// Residual Risk Module
let residualRiskChart = null;

async function loadResidualRisk() {
    try {
        const data = await window.app.apiCall('/api/reports/residual-risk');
        displayResidualRiskMatrix(data);
        displayResidualRiskTable(data);
        
        // Add button to calculate residual risk if not exists
        addCalculateResidualButton();
    } catch (error) {
        console.error('Error loading residual risk:', error);
    }
}

function addCalculateResidualButton() {
    const header = document.querySelector('#residual-risk .sheet-header');
    if (header && !document.getElementById('calculate-residual-btn')) {
        const btn = document.createElement('button');
        btn.id = 'calculate-residual-btn';
        btn.className = 'btn btn-primary';
        btn.textContent = 'Hitung Residual Risk';
        btn.onclick = handleCalculateResidualRisk;
        header.appendChild(btn);
    }
}

async function handleCalculateResidualRisk() {
    // Get all risks
    const risks = await window.app.apiCall('/api/risks');
    
    if (risks.length === 0) {
        alert('Tidak ada risiko yang tersedia. Silakan buat risiko terlebih dahulu.');
        return;
    }

    // Show selection dialog
    const riskOptions = risks.map(r => `${r.kode_risiko || r.id} - ${r.sasaran ? r.sasaran.substring(0, 50) : 'N/A'}`).join('\n');
    const riskIndex = prompt(`Pilih risiko (masukkan nomor 1-${risks.length}):\n${risks.map((r, i) => `${i + 1}. ${r.kode_risiko || r.id}`).join('\n')}`);
    
    if (!riskIndex) return;
    
    const selectedRisk = risks[parseInt(riskIndex) - 1];
    if (!selectedRisk) {
        alert('Risiko tidak valid!');
        return;
    }

    const probability = prompt('Masukkan Probabilitas Residual (1-5):');
    const impact = prompt('Masukkan Dampak Residual (1-5):');
    const financialImpact = prompt('Masukkan Dampak Finansial Residual (Rp):', '0');

    if (!probability || !impact) {
        alert('Probabilitas dan Dampak harus diisi!');
        return;
    }

    try {
        const result = await window.app.apiCall(`/api/risks/${selectedRisk.id}/residual-risk`, {
            method: 'POST',
            body: JSON.stringify({
                probability: parseInt(probability),
                impact: parseInt(impact),
                financial_impact: parseFloat(financialImpact) || 0
            })
        });

        alert('Residual Risk berhasil dihitung!');
        await loadResidualRisk();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function displayResidualRiskMatrix(data) {
    const ctx = document.getElementById('residual-risk-matrix');
    if (!ctx) return;

    // Destroy existing chart
    if (residualRiskChart) {
        residualRiskChart.destroy();
    }

    // Create 5x5 matrix data
    const matrix = createResidualRiskMatrix(data);

    // Create chart
    residualRiskChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Residual Risk',
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
}

function displayResidualRiskTable(data) {
    const container = document.getElementById('residual-risk-table');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p>Tidak ada data residual risk. Silakan hitung residual risk terlebih dahulu.</p>';
        return;
    }

    let html = `
        <h3>Residual Risk Analysis</h3>
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

function createResidualRiskMatrix(data) {
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

function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Make function available globally
window.loadResidualRisk = loadResidualRisk;

