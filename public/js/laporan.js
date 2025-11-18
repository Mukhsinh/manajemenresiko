// Laporan Module
const LaporanModule = {
    async load() {
        try {
            this.render();
        } catch (error) {
            console.error('Error loading laporan:', error);
            document.getElementById('laporan-content').innerHTML =
                '<div class="card"><p>Error: ' + error.message + '</p></div>';
        }
    },

    render() {
        const content = document.getElementById('laporan-content');
        content.innerHTML = `
            <div class="charts-grid mb-3">
                <div class="chart-card">
                    <h4 class="chart-title">Laporan Risk Register</h4>
                    <p>Unduh laporan Risk Register lengkap dalam format Excel.</p>
                    <button class="btn btn-primary" onclick="LaporanModule.download('/api/reports/risk-register', 'laporan-risk-register.xlsx')">
                        <i class="fas fa-download"></i> Unduh Risk Register
                    </button>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Laporan Risk Profile</h4>
                    <p>Unduh laporan Risk Profile dalam format JSON.</p>
                    <button class="btn btn-primary" onclick="LaporanModule.download('/api/reports/risk-profile', 'laporan-risk-profile.json', 'json')">
                        <i class="fas fa-download"></i> Unduh Risk Profile
                    </button>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Laporan Residual Risk</h4>
                    <p>Unduh laporan Residual Risk dalam format JSON.</p>
                    <button class="btn btn-primary" onclick="LaporanModule.download('/api/reports/residual-risk', 'laporan-residual-risk.json', 'json')">
                        <i class="fas fa-download"></i> Unduh Residual Risk
                    </button>
                </div>
                <div class="chart-card">
                    <h4 class="chart-title">Risk Appetite Dashboard</h4>
                    <p>Unduh laporan Risk Appetite Dashboard.</p>
                    <button class="btn btn-primary" onclick="LaporanModule.download('/api/reports/risk-appetite', 'laporan-risk-appetite.json', 'json')">
                        <i class="fas fa-download"></i> Unduh Risk Appetite
                    </button>
                </div>
            </div>
        `;
    },

    async download(endpoint, filename, type = 'blob') {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Gagal mengunduh laporan');

            let data;
            if (type === 'json') {
                data = await response.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                this.triggerDownload(blob, filename);
            } else {
                const blob = await response.blob();
                this.triggerDownload(blob, filename);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    triggerDownload(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};

window.laporanModule = LaporanModule;

