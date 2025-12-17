// Risk Register Module
async function loadRiskRegister() {
    try {
        const data = await window.app.apiCall('/api/reports/risk-register');
        displayRiskRegister(data);
    } catch (error) {
        console.error('Error loading risk register:', error);
    }
}

function displayRiskRegister(data) {
    const container = document.getElementById('risk-register-table');
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<p>Tidak ada data risk register.</p>';
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Kode Risiko</th>
                    <th>Status</th>
                    <th>Jenis</th>
                    <th>Kategori</th>
                    <th>Unit Kerja</th>
                    <th>Sasaran</th>
                    <th>Tanggal Registrasi</th>
                    <th>Penyebab Risiko</th>
                    <th>Dampak Risiko</th>
                    <th>P Inheren</th>
                    <th>D Inheren</th>
                    <th>Nilai Inheren</th>
                    <th>Tingkat Inheren</th>
                    <th>P Residual</th>
                    <th>D Residual</th>
                    <th>Nilai Residual</th>
                    <th>Tingkat Residual</th>
                    <th>Risk Appetite</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach((risk, index) => {
        // Enhanced: Better handling of nested data with proper null checks
        const inherent = (risk.risk_inherent_analysis && Array.isArray(risk.risk_inherent_analysis) && risk.risk_inherent_analysis.length > 0) 
            ? risk.risk_inherent_analysis[0] : null;
        const residual = (risk.risk_residual_analysis && Array.isArray(risk.risk_residual_analysis) && risk.risk_residual_analysis.length > 0) 
            ? risk.risk_residual_analysis[0] : null;
        const appetite = (risk.risk_appetite && Array.isArray(risk.risk_appetite) && risk.risk_appetite.length > 0) 
            ? risk.risk_appetite[0] : null;

        // Enhanced: Better text truncation with proper handling
        const truncateText = (text, maxLength = 50) => {
            if (!text || text === null || text === undefined) return '-';
            const str = String(text);
            return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
        };

        // Enhanced: Better risk level formatting
        const formatRiskLevel = (level) => {
            if (!level) return '-';
            const levelClass = level.toLowerCase().replace(/\s+/g, '-');
            return `<span class="risk-level risk-${levelClass}">${level}</span>`;
        };

        html += `
            <tr>
                <td>${risk.no || index + 1}</td>
                <td>${risk.kode_risiko || '-'}</td>
                <td>${risk.status_risiko || 'Active'}</td>
                <td>${risk.jenis_risiko || 'Threat'}</td>
                <td>${risk.master_risk_categories?.name || '-'}</td>
                <td>${risk.master_work_units?.name || '-'}</td>
                <td title="${risk.sasaran || ''}">${truncateText(risk.sasaran)}</td>
                <td>${formatDate(risk.tanggal_registrasi) || '-'}</td>
                <td title="${risk.penyebab_risiko || ''}">${truncateText(risk.penyebab_risiko)}</td>
                <td title="${risk.dampak_risiko || ''}">${truncateText(risk.dampak_risiko)}</td>
                <td>${inherent?.probability || '-'}</td>
                <td>${inherent?.impact || '-'}</td>
                <td>${inherent?.risk_value || '-'}</td>
                <td>${formatRiskLevel(inherent?.risk_level)}</td>
                <td>${residual?.probability || '-'}</td>
                <td>${residual?.impact || '-'}</td>
                <td>${residual?.risk_value || '-'}</td>
                <td>${formatRiskLevel(residual?.risk_level)}</td>
                <td>${appetite?.risk_appetite_level || '-'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Helper function to format risk level with proper styling
function formatRiskLevel(level) {
    if (!level) return '-';
    
    const levelClass = level.toLowerCase().replace(/\s+/g, '-');
    const colorMap = {
        'low-risk': 'success',
        'medium-risk': 'warning', 
        'high-risk': 'danger',
        'extreme-high': 'dark'
    };
    
    const badgeClass = colorMap[levelClass] || 'secondary';
    return `<span class="badge badge-${badgeClass}" style="font-size: 10px;">${level}</span>`;
}

// Helper function to format currency
function formatCurrency(amount) {
    if (!amount || amount === 0) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

// Make function available globally
window.loadRiskRegister = loadRiskRegister;

