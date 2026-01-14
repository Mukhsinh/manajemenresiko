// Laporan Download Fix - Prevents double download and ensures complete PDF
// This module fixes the download issues in the Laporan page

const LaporanDownloadFix = (() => {
    // Track active downloads to prevent duplicates
    const activeDownloads = new Set();
    
    // Debounce timeout
    let downloadDebounceTimer = null;
    const DEBOUNCE_DELAY = 1000; // 1 second

    // Check if download is already in progress
    function isDownloadInProgress(reportId, type) {
        const key = `${reportId}-${type}`;
        return activeDownloads.has(key);
    }

    // Mark download as started
    function startDownload(reportId, type) {
        const key = `${reportId}-${type}`;
        activeDownloads.add(key);
        console.log(`📥 Download started: ${key}`);
    }

    // Mark download as completed
    function endDownload(reportId, type) {
        const key = `${reportId}-${type}`;
        activeDownloads.delete(key);
        console.log(`✅ Download completed: ${key}`);
    }

    // Get auth token
    async function getAuthToken() {
        try {
            if (window.SupabaseClientManager) {
                const client = await window.SupabaseClientManager.waitForClient(3000);
                const { data } = await client.auth.getSession();
                return data?.session?.access_token || null;
            }
            if (window.supabaseClient) {
                const { data } = await window.supabaseClient.auth.getSession();
                return data?.session?.access_token || null;
            }
            return localStorage.getItem('supabase_token') || null;
        } catch (e) {
            console.warn('Error getting auth token:', e);
            return null;
        }
    }

    // Show progress modal
    function showProgressModal(title, message) {
        // Remove any existing modal first
        const existingModal = document.getElementById('download-progress-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'download-progress-modal';
        modal.innerHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;">
                <div style="background:white;border-radius:16px;padding:2rem;min-width:380px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <div style="margin-bottom:1.5rem;">
                        <i class="fas fa-download" style="font-size:3rem;color:#3498db;animation:pulse 1.5s infinite;"></i>
                    </div>
                    <h4 style="margin-bottom:1rem;color:#2c3e50;font-size:1.25rem;">${title}</h4>
                    <div style="margin-bottom:1rem;">
                        <div style="background:#e9ecef;border-radius:10px;height:12px;overflow:hidden;">
                            <div id="download-progress-bar" style="background:linear-gradient(90deg,#3498db,#2980b9);height:100%;width:0%;transition:width 0.3s ease;"></div>
                        </div>
                    </div>
                    <p id="download-progress-message" style="color:#666;margin:0;font-size:0.95rem;">${message}</p>
                </div>
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
            </style>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    // Update progress
    function updateProgress(modal, percent, message) {
        if (!modal) return;
        const bar = modal.querySelector('#download-progress-bar');
        const msg = modal.querySelector('#download-progress-message');
        if (bar) bar.style.width = `${percent}%`;
        if (msg) msg.textContent = message;
    }

    // Hide modal
    function hideModal(modal) {
        if (modal && modal.parentNode) {
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (modal.parentNode) modal.remove();
            }, 300);
        }
    }

    // Show notification
    function showNotification(title, message, type = 'info') {
        const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db', warning: '#f39c12' };
        const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-circle' };
        
        // Remove existing notifications
        document.querySelectorAll('.download-notification').forEach(n => n.remove());
        
        const notif = document.createElement('div');
        notif.className = 'download-notification';
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: white; border-radius: 12px; 
            padding: 1rem 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 100000; 
            display: flex; align-items: center; gap: 1rem; border-left: 4px solid ${colors[type]}; 
            animation: slideInRight 0.3s ease; max-width: 400px;
        `;
        notif.innerHTML = `
            <i class="fas ${icons[type]}" style="font-size:1.5rem;color:${colors[type]};"></i>
            <div>
                <strong style="display:block;color:#333;">${title}</strong>
                ${message ? `<small style="color:#666;">${message}</small>` : ''}
            </div>
            <style>
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        document.body.appendChild(notif);
        setTimeout(() => { 
            notif.style.opacity = '0'; 
            notif.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notif.remove(), 300); 
        }, 4000);
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Trigger single download
    function triggerSingleDownload(blob, fileName) {
        // Create unique download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Use click() directly without appending to body
        document.body.appendChild(link);
        
        // Single click only
        link.click();
        
        // Cleanup immediately
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`📄 File downloaded: ${fileName}`);
    }

    // Download Excel with duplicate prevention
    async function downloadExcel(reportId, endpoint) {
        // Prevent duplicate downloads
        if (isDownloadInProgress(reportId, 'excel')) {
            console.warn(`⚠️ Excel download already in progress for ${reportId}`);
            showNotification('Download Sedang Berjalan', 'Mohon tunggu download selesai', 'warning');
            return;
        }

        // Debounce rapid clicks
        if (downloadDebounceTimer) {
            clearTimeout(downloadDebounceTimer);
        }

        return new Promise((resolve) => {
            downloadDebounceTimer = setTimeout(async () => {
                let modal = null;
                try {
                    startDownload(reportId, 'excel');
                    modal = showProgressModal('Mengunduh Excel', 'Mempersiapkan...');
                    
                    updateProgress(modal, 20, 'Mengautentikasi...');
                    const token = await getAuthToken();
                    
                    const headers = { 
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    updateProgress(modal, 40, 'Mengunduh data...');
                    const response = await fetch(endpoint, { 
                        method: 'GET',
                        headers,
                        credentials: 'include'
                    });
                    
                    if (!response.ok) {
                        const contentType = response.headers.get('content-type') || '';
                        if (contentType.includes('application/json')) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `HTTP ${response.status}`);
                        }
                        throw new Error(`HTTP ${response.status}: Gagal mengunduh file`);
                    }

                    updateProgress(modal, 70, 'Memproses file...');
                    const blob = await response.blob();
                    
                    if (blob.size === 0) {
                        throw new Error('File Excel kosong. Tidak ada data untuk diunduh.');
                    }

                    const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`;
                    console.log(`Excel ready: ${blob.size} bytes`);

                    updateProgress(modal, 100, 'Selesai!');
                    
                    // Delay to show completion, then download
                    setTimeout(() => {
                        triggerSingleDownload(blob, fileName);
                        hideModal(modal);
                        showNotification('Excel Berhasil Diunduh!', `${fileName} (${formatFileSize(blob.size)})`, 'success');
                        endDownload(reportId, 'excel');
                        resolve(true);
                    }, 500);
                    
                } catch (error) {
                    console.error('Download Excel error:', error);
                    if (modal) hideModal(modal);
                    showNotification('Error Download Excel', error.message, 'error');
                    endDownload(reportId, 'excel');
                    resolve(false);
                }
            }, 300); // 300ms debounce
        });
    }

    // Download PDF with complete content
    async function downloadPDF(reportId, endpoint) {
        // Prevent duplicate downloads
        if (isDownloadInProgress(reportId, 'pdf')) {
            console.warn(`⚠️ PDF download already in progress for ${reportId}`);
            showNotification('Download Sedang Berjalan', 'Mohon tunggu download selesai', 'warning');
            return;
        }

        // Debounce rapid clicks
        if (downloadDebounceTimer) {
            clearTimeout(downloadDebounceTimer);
        }

        return new Promise((resolve) => {
            downloadDebounceTimer = setTimeout(async () => {
                let modal = null;
                try {
                    startDownload(reportId, 'pdf');
                    modal = showProgressModal('Mengunduh PDF', 'Mempersiapkan...');
                    
                    updateProgress(modal, 20, 'Mengautentikasi...');
                    const token = await getAuthToken();
                    
                    const headers = { 'Accept': 'application/pdf' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    updateProgress(modal, 40, 'Mengunduh dari server...');
                    
                    // Try server-side PDF first
                    try {
                        const response = await fetch(endpoint, { 
                            method: 'GET',
                            headers,
                            credentials: 'include'
                        });
                        
                        const contentType = response.headers.get('content-type') || '';

                        if (response.ok && contentType.includes('pdf')) {
                            updateProgress(modal, 80, 'Memproses file...');
                            const blob = await response.blob();
                            
                            if (blob.size > 0) {
                                const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
                                console.log(`PDF from server: ${blob.size} bytes`);

                                updateProgress(modal, 100, 'Selesai!');
                                setTimeout(() => {
                                    triggerSingleDownload(blob, fileName);
                                    hideModal(modal);
                                    showNotification('PDF Berhasil Diunduh!', `${fileName} (${formatFileSize(blob.size)})`, 'success');
                                    endDownload(reportId, 'pdf');
                                    resolve(true);
                                }, 500);
                                return;
                            }
                        }
                    } catch (serverError) {
                        console.warn('Server PDF not available:', serverError.message);
                    }

                    // Fallback to client-side PDF generation
                    updateProgress(modal, 50, 'Membuat PDF lokal...');
                    const success = await generateCompletePDF(reportId, modal);
                    
                    if (success) {
                        hideModal(modal);
                        endDownload(reportId, 'pdf');
                        resolve(true);
                    } else {
                        throw new Error('Gagal membuat PDF. Silakan coba unduh Excel.');
                    }
                    
                } catch (error) {
                    console.error('Download PDF error:', error);
                    if (modal) hideModal(modal);
                    showNotification('Error Download PDF', error.message, 'error');
                    endDownload(reportId, 'pdf');
                    resolve(false);
                }
            }, 300); // 300ms debounce
        });
    }

    // Generate complete PDF with all data (no truncation)
    async function generateCompletePDF(reportId, modal) {
        try {
            // Load jsPDF if not available
            if (!window.jspdf && !window.jsPDF) {
                updateProgress(modal, 55, 'Memuat library PDF...');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js');
            }

            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                console.error('jsPDF not available');
                return false;
            }

            updateProgress(modal, 65, 'Mengambil data lengkap...');
            const data = await fetchAllReportData(reportId);
            
            if (!data || data.length === 0) {
                showNotification('Tidak Ada Data', 'Data kosong untuk laporan ini', 'warning');
                return false;
            }

            updateProgress(modal, 75, `Membuat PDF (${data.length} records)...`);
            
            // Create PDF in landscape for more columns
            const doc = new jsPDF('l', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Title
            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80);
            doc.text(getReportTitle(reportId), pageWidth / 2, 15, { align: 'center' });
            
            // Subtitle with date and record count
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 22, { align: 'center' });
            doc.text(`Total Data: ${data.length} records`, pageWidth / 2, 28, { align: 'center' });

            // Prepare table columns - get ALL columns from data
            const allColumns = Object.keys(data[0]);
            const columns = [{ header: 'No', dataKey: 'No' }];
            
            allColumns.forEach(col => {
                columns.push({
                    header: formatColumnName(col),
                    dataKey: col
                });
            });

            // Format ALL data for table (no limit)
            const tableData = data.map((row, index) => {
                const formattedRow = { 'No': index + 1 };
                allColumns.forEach(col => {
                    let value = row[col];
                    if (typeof value === 'object' && value !== null) {
                        value = value.name || JSON.stringify(value);
                    }
                    formattedRow[col] = value !== null && value !== undefined ? String(value) : '-';
                });
                return formattedRow;
            });

            updateProgress(modal, 85, 'Menyusun tabel...');

            // Use autoTable for complete data rendering
            if (doc.autoTable) {
                doc.autoTable({
                    startY: 35,
                    head: [columns.map(c => c.header)],
                    body: tableData.map(row => columns.map(c => row[c.dataKey])),
                    theme: 'grid',
                    headStyles: {
                        fillColor: [52, 73, 94],
                        textColor: 255,
                        fontSize: 8,
                        fontStyle: 'bold',
                        halign: 'center',
                        cellPadding: 3
                    },
                    bodyStyles: {
                        fontSize: 7,
                        cellPadding: 2,
                        overflow: 'linebreak', // Allow text wrapping
                        cellWidth: 'wrap'
                    },
                    alternateRowStyles: {
                        fillColor: [248, 249, 250]
                    },
                    columnStyles: {
                        0: { cellWidth: 10, halign: 'center' } // No column
                    },
                    margin: { top: 35, left: 10, right: 10, bottom: 20 },
                    tableWidth: 'auto',
                    showHead: 'everyPage',
                    didDrawPage: function(data) {
                        // Footer on each page
                        const pageCount = doc.internal.getNumberOfPages();
                        doc.setFontSize(8);
                        doc.setTextColor(128);
                        doc.text(
                            `Halaman ${data.pageNumber} dari ${pageCount}`,
                            pageWidth / 2,
                            pageHeight - 10,
                            { align: 'center' }
                        );
                        
                        // Header on each page (except first)
                        if (data.pageNumber > 1) {
                            doc.setFontSize(10);
                            doc.setTextColor(100);
                            doc.text(getReportTitle(reportId), 10, 10);
                        }
                    }
                });
            }

            updateProgress(modal, 95, 'Menyimpan PDF...');
            
            const fileName = `${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            updateProgress(modal, 100, 'Selesai!');
            
            setTimeout(() => {
                showNotification('PDF Berhasil Dibuat!', `${fileName} - ${data.length} records lengkap`, 'success');
            }, 300);
            
            return true;
        } catch (e) {
            console.error('Client PDF generation error:', e);
            return false;
        }
    }

    // Fetch ALL report data (no limit)
    async function fetchAllReportData(reportId) {
        const endpoints = {
            'risk-register': '/api/reports/risk-register',
            'risk-profile': '/api/reports/risk-profile',
            'residual-risk': '/api/reports/residual-risk',
            'risk-appetite': '/api/reports/risk-appetite-dashboard',
            'kri-dashboard': '/api/kri',
            'monitoring-evaluasi': '/api/monitoring-evaluasi',
            'loss-event': '/api/loss-events',
            'strategic-map': '/api/strategic-map'
        };

        const endpoint = endpoints[reportId];
        if (!endpoint) return [];

        try {
            const token = await getAuthToken();
            const headers = { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const response = await fetch(endpoint, { 
                method: 'GET',
                headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.error(`Failed to fetch ${reportId}:`, response.status);
                return [];
            }
            
            const data = await response.json();
            
            // Handle different response formats
            let result = [];
            if (Array.isArray(data)) {
                result = data;
            } else if (data.data && Array.isArray(data.data)) {
                result = data.data;
            } else if (data.fullData && Array.isArray(data.fullData)) {
                result = data.fullData;
            } else if (typeof data === 'object' && data !== null) {
                result = [data];
            }
            
            // Flatten nested objects
            result = result.map(item => flattenObject(item));
            
            console.log(`Fetched ALL ${result.length} records for ${reportId}`);
            return result;
        } catch (e) {
            console.error('Error fetching report data:', e);
            return [];
        }
    }

    // Flatten nested objects for table display
    function flattenObject(obj, prefix = '') {
        const result = {};
        const skipKeys = ['id', 'user_id', 'organization_id', 'created_at', 'updated_at'];
        
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            if (skipKeys.includes(key) && prefix) continue;
            
            const value = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;
            
            if (value === null || value === undefined) {
                result[newKey] = '-';
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                if (value.name) {
                    result[newKey] = value.name;
                } else {
                    const nested = flattenObject(value, newKey);
                    Object.assign(result, nested);
                }
            } else if (Array.isArray(value)) {
                if (value.length > 0 && typeof value[0] === 'object') {
                    const firstItem = value[0];
                    if (firstItem.risk_value !== undefined) {
                        result[`${newKey}_value`] = firstItem.risk_value;
                        result[`${newKey}_level`] = firstItem.risk_level || '-';
                    }
                } else {
                    result[newKey] = value.join(', ');
                }
            } else {
                result[newKey] = value;
            }
        }
        
        return result;
    }

    // Get report title
    function getReportTitle(reportId) {
        const titles = {
            'risk-register': 'Laporan Risk Register',
            'risk-profile': 'Laporan Risk Profile (Inherent)',
            'residual-risk': 'Laporan Residual Risk',
            'risk-appetite': 'Laporan Risk Appetite',
            'kri-dashboard': 'Laporan KRI Dashboard',
            'monitoring-evaluasi': 'Laporan Monitoring & Evaluasi',
            'loss-event': 'Laporan Loss Event',
            'strategic-map': 'Laporan Strategic Map'
        };
        return titles[reportId] || 'Laporan';
    }

    // Format column name
    function formatColumnName(name) {
        return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Load external script
    async function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Override LaporanModule download functions
    function applyFix() {
        if (window.LaporanModule) {
            console.log('🔧 Applying download fix to LaporanModule...');
            window.LaporanModule.downloadExcel = downloadExcel;
            window.LaporanModule.downloadPDF = downloadPDF;
            console.log('✅ Download fix applied successfully');
        }
    }

    // Auto-apply fix when module loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applyFix, 500);
        });
    } else {
        setTimeout(applyFix, 500);
    }

    // Public API
    return {
        downloadExcel,
        downloadPDF,
        applyFix,
        isDownloadInProgress
    };
})();

// Export globally
window.LaporanDownloadFix = LaporanDownloadFix;
console.log('✅ LaporanDownloadFix loaded');
