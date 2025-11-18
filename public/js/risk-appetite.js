// Risk Appetite Module
async function loadRiskAppetite() {
    try {
        // Load risks for dropdown
        const risks = await window.app.apiCall('/api/risks');
        populateRiskDropdown(risks);

        // Load existing risk appetite
        const appetiteData = await window.app.apiCall('/api/master-data/risk-appetite');
        displayRiskAppetiteDashboard(appetiteData);

        // Setup form
        setupRiskAppetiteForm();
    } catch (error) {
        console.error('Error loading risk appetite:', error);
    }
}

function populateRiskDropdown(risks) {
    const select = document.getElementById('risk-appetite-risk-id');
    select.innerHTML = '<option value="">Pilih Risiko</option>';
    
    risks.forEach(risk => {
        const option = document.createElement('option');
        option.value = risk.id;
        option.textContent = `${risk.kode_risiko || 'N/A'} - ${risk.sasaran ? risk.sasaran.substring(0, 50) : 'N/A'}`;
        select.appendChild(option);
    });
}

function setupRiskAppetiteForm() {
    const insertBtn = document.getElementById('insert-risk-appetite-btn');
    insertBtn.addEventListener('click', handleInsertRiskAppetite);
}

async function handleInsertRiskAppetite() {
    const riskId = document.getElementById('risk-appetite-risk-id').value;
    const appetiteLevel = document.getElementById('risk-appetite-level').value;

    if (!riskId || !appetiteLevel) {
        alert('Silakan pilih risiko dan risk appetite level!');
        return;
    }

    try {
        await window.app.apiCall('/api/master-data/risk-appetite', {
            method: 'POST',
            body: JSON.stringify({
                risk_input_id: riskId,
                risk_appetite_level: appetiteLevel
            })
        });

        alert('Risk Appetite berhasil disimpan!');
        await loadRiskAppetite();
        document.getElementById('risk-appetite-form').reset();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function displayRiskAppetiteDashboard(data) {
    const container = document.getElementById('risk-appetite-dashboard');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p>Belum ada data risk appetite. Silakan insert risk appetite terlebih dahulu.</p>';
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Kode Risiko</th>
                    <th>Sasaran</th>
                    <th>Inherent Risk</th>
                    <th>Residual Risk</th>
                    <th>Risk Appetite</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        const risk = item.risk_inputs || {};
        const inherent = item.risk_inherent_analysis || {};
        const residual = item.risk_residual_analysis || {};
        
        // Determine status
        let status = 'OK';
        let statusClass = 'risk-low';
        if (residual.risk_level && item.risk_appetite_level) {
            const residualLevel = residual.risk_level;
            const appetiteLevel = item.risk_appetite_level;
            
            // Simple comparison (can be enhanced)
            if (residualLevel === 'EXTREME HIGH' && appetiteLevel !== 'EXTREME HIGH') {
                status = 'EXCEED';
                statusClass = 'risk-extreme';
            } else if (residualLevel === 'HIGH RISK' && ['LOW RISK', 'MEDIUM RISK'].includes(appetiteLevel)) {
                status = 'EXCEED';
                statusClass = 'risk-high';
            }
        }

        html += `
            <tr>
                <td>${risk.kode_risiko || '-'}</td>
                <td>${risk.sasaran ? risk.sasaran.substring(0, 50) + '...' : '-'}</td>
                <td><span class="risk-${(inherent.risk_level || '').toLowerCase().replace(' ', '-')}">${inherent.risk_level || '-'}</span></td>
                <td><span class="risk-${(residual.risk_level || '').toLowerCase().replace(' ', '-')}">${residual.risk_level || '-'}</span></td>
                <td><span class="risk-${(item.risk_appetite_level || '').toLowerCase().replace(' ', '-')}">${item.risk_appetite_level || '-'}</span></td>
                <td><span class="${statusClass}">${status}</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Make function available globally
window.loadRiskAppetite = loadRiskAppetite;

