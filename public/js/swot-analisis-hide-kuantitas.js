/**
 * JavaScript untuk menyembunyikan kolom kuantitas di tabel SWOT Analisis
 */

(function() {
    'use strict';
    
    // Fungsi untuk menyembunyikan kolom kuantitas
    function hideKuantitasColumn() {
        // Cari semua tabel yang mungkin berisi data SWOT
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            // Cari header yang mengandung "kuantitas" (case insensitive)
            const headers = table.querySelectorAll('th');
            let kuantitasColumnIndex = -1;
            
            headers.forEach((header, index) => {
                const headerText = header.textContent.toLowerCase().trim();
                if (headerText.includes('kuantitas') || 
                    header.getAttribute('data-field') === 'kuantitas' ||
                    header.classList.contains('kuantitas-column')) {
                    kuantitasColumnIndex = index;
                    header.style.display = 'none';
                }
            });
            
            // Jika ditemukan kolom kuantitas, sembunyikan semua cell di kolom tersebut
            if (kuantitasColumnIndex !== -1) {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th');
                    if (cells[kuantitasColumnIndex]) {
                        cells[kuantitasColumnIndex].style.display = 'none';
                    }
                });
            }
        });
        
        // Untuk DataTables yang mungkin di-load secara dinamis
        if (typeof $ !== 'undefined' && $.fn.DataTable) {
            $('.dataTable').each(function() {
                const table = $(this).DataTable();
                if (table) {
                    // Cari kolom kuantitas dan sembunyikan
                    table.columns().every(function(index) {
                        const header = $(this.header());
                        const headerText = header.text().toLowerCase();
                        if (headerText.includes('kuantitas')) {
                            this.visible(false);
                        }
                    });
                }
            });
        }
    }
    
    // Fungsi untuk menyembunyikan kolom berdasarkan index (jika diketahui posisinya)
    function hideColumnByIndex(tableSelector, columnIndex) {
        const table = document.querySelector(tableSelector);
        if (table) {
            // Sembunyikan header
            const headerCell = table.querySelector(`th:nth-child(${columnIndex + 1})`);
            if (headerCell) {
                headerCell.style.display = 'none';
            }
            
            // Sembunyikan semua cell di kolom tersebut
            const cells = table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
            cells.forEach(cell => {
                cell.style.display = 'none';
            });
        }
    }
    
    // Fungsi untuk menambahkan class CSS yang menyembunyikan kolom
    function addHideKuantitasCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .hide-kuantitas th:nth-child(7),
            .hide-kuantitas td:nth-child(7),
            .kuantitas-hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Observer untuk mendeteksi tabel yang di-load secara dinamis
    function observeTableChanges() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Jika node yang ditambahkan adalah tabel atau mengandung tabel
                            if (node.tagName === 'TABLE' || node.querySelector('table')) {
                                setTimeout(hideKuantitasColumn, 100);
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Inisialisasi
    function init() {
        // Tambahkan CSS
        addHideKuantitasCSS();
        
        // Sembunyikan kolom kuantitas yang sudah ada
        hideKuantitasColumn();
        
        // Mulai observasi untuk tabel dinamis
        observeTableChanges();
        
        // Jalankan lagi setelah DOM selesai dimuat
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideKuantitasColumn);
        }
        
        // Jalankan lagi setelah window selesai dimuat (untuk konten yang di-load via AJAX)
        window.addEventListener('load', function() {
            setTimeout(hideKuantitasColumn, 500);
        });
    }
    
    // Expose fungsi ke global scope untuk penggunaan manual
    window.SwotAnalisisUtils = {
        hideKuantitasColumn: hideKuantitasColumn,
        hideColumnByIndex: hideColumnByIndex,
        addHideKuantitasCSS: addHideKuantitasCSS
    };
    
    // Jalankan inisialisasi
    init();
    
})();

// Untuk Vue.js atau React (jika digunakan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        hideKuantitasColumn: hideKuantitasColumn,
        hideColumnByIndex: hideColumnByIndex
    };
}