/**
 * RENCANA STRATEGIS FILTER MODULE v1.0
 * Handles filter functionality for Rencana Strategis page
 * Created: 2026-01-09
 */

(function() {
    'use strict';
    
    console.log('🔍 Rencana Strategis Filter Module loading...');
    
    // Filter state
    const filterState = {
        status: '',
        tahun: '',
        search: '',
        originalData: []
    };
    
    /**
     * Initialize filter controls
     */
    function initializeFilters() {
        console.log('🔧 Initializing filter controls...');
        
        const container = document.getElementById('rencana-strategis-content');
        if (!container) {
            console.warn('⚠️ Container not found, retrying...');
            setTimeout(initializeFilters, 500);
            return;
        }
        
        // Check if filters already exist
        if (container.querySelector('.rs-filter-section')) {
            console.log('✅ Filters already initialized');
            return;
        }
        
        // Wait for wrapper to be rendered
        const wrapper = container.querySelector('.rencana-strategis-wrapper');
        if (!wrapper) {
            console.warn('⚠️ Wrapper not found, retrying...');
            setTimeout(initializeFilters, 500);
            return;
        }
        
        // Find the table card
        const tableCard = wrapper.querySelector('.card.shadow-sm:not(#rs-form-section)');
        if (!tableCard) {
            console.warn('⚠️ Table card not found, retrying...');
            setTimeout(initializeFilters, 500);
            return;
        }
        
        // Create filter section
        const filterSection = createFilterSection();
        
        // Insert filter section before table card
        tableCard.parentNode.insertBefore(filterSection, tableCard);
        
        // Bind filter events
        bindFilterEvents();
        
        // Store original data
        storeOriginalData();
        
        console.log('✅ Filter controls initialized');
    }
    
    /**
     * Create filter section HTML
     */
    function createFilterSection() {
        const filterDiv = document.createElement('div');
        filterDiv.className = 'rs-filter-section card mb-4 shadow-sm border-0';
        filterDiv.style.borderRadius = '12px';
        
        filterDiv.innerHTML = `
            <div class="card-body p-3">
                <div class="row g-3 align-items-end">
                    <!-- Search Input -->
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label fw-semibold small mb-1">
                            <i class="fas fa-search text-primary me-1"></i>Cari
                        </label>
                        <input type="text" 
                               class="form-control" 
                               id="rs-filter-search" 
                               placeholder="Cari nama rencana, kode..."
                               style="border-radius: 8px;">
                    </div>
                    
                    <!-- Status Filter -->
                    <div class="col-lg-2 col-md-3 col-sm-6">
                        <label class="form-label fw-semibold small mb-1">
                            <i class="fas fa-flag text-warning me-1"></i>Status
                        </label>
                        <select class="form-select" id="rs-filter-status" style="border-radius: 8px;">
                            <option value="">Semua Status</option>
                            <option value="Aktif">✅ Aktif</option>
                            <option value="Draft">📝 Draft</option>
                            <option value="Selesai">🏁 Selesai</option>
                        </select>
                    </div>
                    
                    <!-- Year Filter -->
                    <div class="col-lg-2 col-md-3 col-sm-6">
                        <label class="form-label fw-semibold small mb-1">
                            <i class="fas fa-calendar text-info me-1"></i>Tahun
                        </label>
                        <select class="form-select" id="rs-filter-tahun" style="border-radius: 8px;">
                            <option value="">Semua Tahun</option>
                            ${generateYearOptions()}
                        </select>
                    </div>
                    
                    <!-- Filter Buttons -->
                    <div class="col-lg-4 col-md-12">
                        <div class="d-flex gap-2 flex-wrap">
                            <button type="button" class="btn btn-primary" id="rs-filter-apply">
                                <i class="fas fa-filter me-1"></i>Terapkan
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="rs-filter-reset">
                                <i class="fas fa-undo me-1"></i>Reset
                            </button>
                            <button type="button" class="btn btn-outline-info" id="rs-filter-refresh">
                                <i class="fas fa-sync-alt me-1"></i>Refresh
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Active Filters Display -->
                <div id="rs-active-filters" class="mt-2" style="display: none;">
                    <small class="text-muted">Filter aktif: </small>
                    <span id="rs-filter-badges"></span>
                </div>
            </div>
        `;
        
        return filterDiv;
    }
    
    /**
     * Generate year options for dropdown
     */
    function generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        
        for (let year = currentYear + 2; year >= currentYear - 5; year--) {
            options += `<option value="${year}">${year}</option>`;
        }
        
        return options;
    }
    
    /**
     * Bind filter event handlers
     */
    function bindFilterEvents() {
        // Search input - real-time filtering
        const searchInput = document.getElementById('rs-filter-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(applyFilters, 300));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyFilters();
                }
            });
        }
        
        // Status filter
        const statusSelect = document.getElementById('rs-filter-status');
        if (statusSelect) {
            statusSelect.addEventListener('change', applyFilters);
        }
        
        // Year filter
        const tahunSelect = document.getElementById('rs-filter-tahun');
        if (tahunSelect) {
            tahunSelect.addEventListener('change', applyFilters);
        }
        
        // Apply button
        const applyBtn = document.getElementById('rs-filter-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyFilters);
        }
        
        // Reset button
        const resetBtn = document.getElementById('rs-filter-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetFilters);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('rs-filter-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshData);
        }
        
        console.log('✅ Filter events bound');
    }
    
    /**
     * Store original data for filtering
     */
    function storeOriginalData() {
        if (window.RencanaStrategisModule && window.RencanaStrategisModule.state) {
            filterState.originalData = [...(window.RencanaStrategisModule.state.data || [])];
            console.log('📊 Stored', filterState.originalData.length, 'records for filtering');
        }
    }
    
    /**
     * Apply filters to data
     */
    function applyFilters() {
        console.log('🔍 Applying filters...');
        
        // Get filter values
        const searchInput = document.getElementById('rs-filter-search');
        const statusSelect = document.getElementById('rs-filter-status');
        const tahunSelect = document.getElementById('rs-filter-tahun');
        
        filterState.search = (searchInput?.value || '').toLowerCase().trim();
        filterState.status = statusSelect?.value || '';
        filterState.tahun = tahunSelect?.value || '';
        
        console.log('Filter values:', filterState);
        
        // Get data from module
        let data = [];
        if (window.RencanaStrategisModule && window.RencanaStrategisModule.state) {
            // Use original data if available, otherwise use current data
            data = filterState.originalData.length > 0 
                ? [...filterState.originalData] 
                : [...(window.RencanaStrategisModule.state.data || [])];
        }
        
        // Apply filters
        let filteredData = data.filter(item => {
            // Search filter
            if (filterState.search) {
                const searchFields = [
                    item.kode || '',
                    item.nama_rencana || '',
                    item.deskripsi || '',
                    item.target || ''
                ].join(' ').toLowerCase();
                
                if (!searchFields.includes(filterState.search)) {
                    return false;
                }
            }
            
            // Status filter
            if (filterState.status && item.status !== filterState.status) {
                return false;
            }
            
            // Year filter
            if (filterState.tahun) {
                const itemYear = item.periode_mulai 
                    ? new Date(item.periode_mulai).getFullYear().toString()
                    : '';
                if (itemYear !== filterState.tahun) {
                    return false;
                }
            }
            
            return true;
        });
        
        console.log('📊 Filtered:', filteredData.length, 'of', data.length, 'records');
        
        // Update table with filtered data
        updateTableWithFilteredData(filteredData);
        
        // Update active filters display
        updateActiveFiltersDisplay();
    }
    
    /**
     * Update table with filtered data
     */
    function updateTableWithFilteredData(filteredData) {
        const tbody = document.querySelector('.rencana-strategis-wrapper table tbody');
        if (!tbody) {
            console.warn('⚠️ Table tbody not found');
            return;
        }
        
        if (filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 border-0">
                        <div class="py-4">
                            <div class="mb-3" style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-search fa-2x text-muted"></i>
                            </div>
                            <h5 class="text-muted mb-2">Tidak Ada Data</h5>
                            <p class="text-muted mb-3">Tidak ada data yang sesuai dengan filter</p>
                            <button class="btn btn-outline-primary" onclick="window.RSFilterModule.resetFilters()">
                                <i class="fas fa-undo me-1"></i>Reset Filter
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Render filtered rows
        tbody.innerHTML = filteredData.map((item, index) => {
            const statusBadge = getStatusBadge(item.status);
            const periode = formatPeriode(item.periode_mulai, item.periode_selesai);
            const rowBg = index % 2 === 0 ? '' : 'style="background-color: #fafbfc;"';
            
            return `
                <tr ${rowBg}>
                    <td class="align-middle">
                        <span class="badge bg-light text-dark border fw-normal px-2 py-1">${item.kode || '-'}</span>
                    </td>
                    <td class="align-middle">
                        <div class="fw-semibold text-dark">${item.nama_rencana || '-'}</div>
                        ${item.deskripsi ? `<small class="text-muted d-block mt-1" style="line-height: 1.3;">${truncateText(item.deskripsi, 80)}</small>` : ''}
                    </td>
                    <td class="align-middle">
                        <small class="text-muted">${truncateText(item.target || '-', 50)}</small>
                    </td>
                    <td class="align-middle">
                        <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i>${periode}</small>
                    </td>
                    <td class="align-middle">${statusBadge}</td>
                    <td class="align-middle text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-info border-0" onclick="RencanaStrategisModule.viewDetail('${item.id}')" title="Lihat Detail">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-warning border-0" onclick="RencanaStrategisModule.startEdit('${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger border-0" onclick="RencanaStrategisModule.deleteRencana('${item.id}')" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * Update active filters display
     */
    function updateActiveFiltersDisplay() {
        const container = document.getElementById('rs-active-filters');
        const badgesContainer = document.getElementById('rs-filter-badges');
        
        if (!container || !badgesContainer) return;
        
        const badges = [];
        
        if (filterState.search) {
            badges.push(`<span class="badge bg-primary me-1">Pencarian: "${filterState.search}"</span>`);
        }
        if (filterState.status) {
            badges.push(`<span class="badge bg-warning text-dark me-1">Status: ${filterState.status}</span>`);
        }
        if (filterState.tahun) {
            badges.push(`<span class="badge bg-info me-1">Tahun: ${filterState.tahun}</span>`);
        }
        
        if (badges.length > 0) {
            container.style.display = 'block';
            badgesContainer.innerHTML = badges.join('');
        } else {
            container.style.display = 'none';
        }
    }
    
    /**
     * Reset all filters
     */
    function resetFilters() {
        console.log('🔄 Resetting filters...');
        
        // Reset filter inputs
        const searchInput = document.getElementById('rs-filter-search');
        const statusSelect = document.getElementById('rs-filter-status');
        const tahunSelect = document.getElementById('rs-filter-tahun');
        
        if (searchInput) searchInput.value = '';
        if (statusSelect) statusSelect.value = '';
        if (tahunSelect) tahunSelect.value = '';
        
        // Reset filter state
        filterState.search = '';
        filterState.status = '';
        filterState.tahun = '';
        
        // Restore original data
        if (filterState.originalData.length > 0) {
            updateTableWithFilteredData(filterState.originalData);
        } else {
            // Reload from module
            if (window.RencanaStrategisModule && window.RencanaStrategisModule.state) {
                updateTableWithFilteredData(window.RencanaStrategisModule.state.data || []);
            }
        }
        
        // Hide active filters display
        const container = document.getElementById('rs-active-filters');
        if (container) container.style.display = 'none';
        
        console.log('✅ Filters reset');
    }
    
    /**
     * Refresh data from server
     */
    async function refreshData() {
        console.log('🔄 Refreshing data...');
        
        // Show loading state
        const refreshBtn = document.getElementById('rs-filter-refresh');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...';
        }
        
        try {
            // Reload module data
            if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.refreshData === 'function') {
                await window.RencanaStrategisModule.refreshData();
            } else if (window.RencanaStrategisModule && typeof window.RencanaStrategisModule.load === 'function') {
                // Reset lock to allow reload
                window.rencanaStrategisModuleLoaded = false;
                window.rencanaStrategisLoadTime = 0;
                await window.RencanaStrategisModule.load();
            }
            
            // Update original data
            storeOriginalData();
            
            // Re-apply current filters
            applyFilters();
            
            console.log('✅ Data refreshed');
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            alert('Gagal memuat ulang data: ' + error.message);
        } finally {
            // Restore button state
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Refresh';
            }
        }
    }
    
    // Helper functions
    function getStatusBadge(status) {
        if (status === 'Aktif') return '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>';
        if (status === 'Draft') return '<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i>Draft</span>';
        if (status === 'Selesai') return '<span class="badge bg-secondary"><i class="fas fa-flag-checkered me-1"></i>Selesai</span>';
        return '<span class="badge bg-light text-dark">' + (status || 'Draft') + '</span>';
    }
    
    function formatPeriode(mulai, selesai) {
        if (!mulai && !selesai) return '-';
        const formatDate = (d) => {
            if (!d) return '';
            return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        return formatDate(mulai) + ' - ' + formatDate(selesai);
    }
    
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Initialize when DOM is ready and RS page is active
     */
    function init() {
        // Check if on RS page
        const isRSPage = window.location.pathname === '/rencana-strategis' ||
                        window.location.pathname.includes('rencana-strategis') ||
                        window.location.hash === '#rencana-strategis';
        
        const rsPage = document.getElementById('rencana-strategis');
        const isRSActive = rsPage?.classList.contains('active');
        
        if (isRSPage || isRSActive) {
            // Wait for module to load first
            setTimeout(initializeFilters, 1000);
        }
    }
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also initialize when navigating to RS page
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#rencana-strategis') {
            setTimeout(initializeFilters, 1000);
        }
    });
    
    // Listen for custom navigation events
    document.addEventListener('pageNavigated', (e) => {
        if (e.detail?.page === 'rencana-strategis') {
            setTimeout(initializeFilters, 1000);
        }
    });
    
    // Export module
    window.RSFilterModule = {
        init: initializeFilters,
        applyFilters,
        resetFilters,
        refreshData,
        storeOriginalData
    };
    
    console.log('✅ Rencana Strategis Filter Module loaded');
    
})();
