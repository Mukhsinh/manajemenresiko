// Modern SWOT Analysis Module
const ModernSwotModule = (() => {
    let state = {
        data: [],
        filteredData: [],
        currentFilter: 'all',
        currentPage: 1,
        itemsPerPage: 10,
        searchQuery: '',
        rencanaStrategis: [],
        unitKerja: [],
        categories: ['Strength', 'Weakness', 'Opportunity', 'Threat'],
        isLoading: false
    };

    // Initialize module
    async function init() {
        console.log('Initializing Modern SWOT Module...');
        await loadData();
        setupEventListeners();
    }

    // Load SWOT data
    async function loadData() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        showLoadingState();

        try {
            console.log('Loading SWOT data...');
            
            // Load SWOT analysis data
            const response = await fetch('/api/analisis-swot');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            state.data = Array.isArray(data) ? data : [];
            state.filteredData = state.data;
            
            console.log('SWOT data loaded:', state.data.length, 'items');
            
            // Load master data
            await loadMasterData();
            
            // Update UI
            updateStatistics();
            renderTable();
            updateMatrix();
            
        } catch (error) {
            console.error('Error loading SWOT data:', error);
            showErrorState(error.message);
        } finally {
            state.isLoading = false;
        }
    }

    // Load master data
    async function loadMasterData() {
        try {
            const [rencanaRes, unitRes] = await Promise.all([
                fetch('/api/rencana-strategis'),
                fetch('/api/master-data/work-units')
            ]);
            
            if (rencanaRes.ok) {
                state.rencanaStrategis = await rencanaRes.json();
            }
            
            if (unitRes.ok) {
                state.unitKerja = await unitRes.json();
            }
        } catch (error) {
            console.warn('Error loading master data:', error);
        }
    }

    // Show loading state
    function showLoadingState() {
        const tableBody = document.getElementById('swotTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                        <div class="flex flex-col items-center gap-2">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span>Memuat data analisis SWOT...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // Show error state
    function showErrorState(message) {
        const tableBody = document.getElementById('swotTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-red-500">
                        <div class="flex flex-col items-center gap-2">
                            <span class="material-symbols-outlined text-4xl text-red-300">error</span>
                            <span>Error: ${message}</span>
                            <button onclick="modernSwotModule.refresh()" class="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm">
                                Coba Lagi
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // Update statistics cards
    function updateStatistics() {
        const stats = calculateStatistics();
        const statsContainer = document.getElementById('statsCards');
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                            <span class="material-symbols-outlined filled">trending_up</span>
                        </div>
                        <span class="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Kekuatan</span>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Strengths</p>
                        <h3 class="text-3xl font-bold text-slate-800">${stats.strength.count}</h3>
                        <p class="text-xs text-slate-500 mt-1">Total Score: ${stats.strength.totalScore}</p>
                    </div>
                </div>
                <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2.5 bg-red-50 rounded-xl text-red-600">
                            <span class="material-symbols-outlined filled">trending_down</span>
                        </div>
                        <span class="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">Kelemahan</span>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weaknesses</p>
                        <h3 class="text-3xl font-bold text-slate-800">${stats.weakness.count}</h3>
                        <p class="text-xs text-slate-500 mt-1">Total Score: ${stats.weakness.totalScore}</p>
                    </div>
                </div>
                <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                            <span class="material-symbols-outlined filled">lightbulb</span>
                        </div>
                        <span class="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">Peluang</span>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Opportunities</p>
                        <h3 class="text-3xl font-bold text-slate-800">${stats.opportunity.count}</h3>
                        <p class="text-xs text-slate-500 mt-1">Total Score: ${stats.opportunity.totalScore}</p>
                    </div>
                </div>
                <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                            <span class="material-symbols-outlined filled">warning</span>
                        </div>
                        <span class="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">Ancaman</span>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Threats</p>
                        <h3 class="text-3xl font-bold text-slate-800">${stats.threat.count}</h3>
                        <p class="text-xs text-slate-500 mt-1">Total Score: ${stats.threat.totalScore}</p>
                    </div>
                </div>
            `;
        }
    }

    // Calculate statistics
    function calculateStatistics() {
        const stats = {
            strength: { count: 0, totalScore: 0 },
            weakness: { count: 0, totalScore: 0 },
            opportunity: { count: 0, totalScore: 0 },
            threat: { count: 0, totalScore: 0 }
        };

        state.filteredData.forEach(item => {
            const category = item.kategori?.toLowerCase();
            const score = parseInt(item.score) || 0;
            
            if (category === 'strength') {
                stats.strength.count++;
                stats.strength.totalScore += score;
            } else if (category === 'weakness') {
                stats.weakness.count++;
                stats.weakness.totalScore += score;
            } else if (category === 'opportunity') {
                stats.opportunity.count++;
                stats.opportunity.totalScore += score;
            } else if (category === 'threat') {
                stats.threat.count++;
                stats.threat.totalScore += score;
            }
        });

        return stats;
    }

    // Render table
    function renderTable() {
        const tableBody = document.getElementById('swotTableBody');
        const tableInfo = document.getElementById('tableInfo');
        
        if (!tableBody) return;

        if (state.filteredData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                        <div class="flex flex-col items-center gap-2">
                            <span class="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                            <span>Tidak ada data SWOT yang ditemukan</span>
                        </div>
                    </td>
                </tr>
            `;
            if (tableInfo) tableInfo.textContent = 'Tidak ada data';
            return;
        }

        // Pagination
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const paginatedData = state.filteredData.slice(startIndex, endIndex);

        tableBody.innerHTML = paginatedData.map(item => {
            const unitName = getUnitName(item.unit_kerja_id);
            const categoryBadge = getCategoryBadge(item.kategori);
            
            return `
                <tr class="hover:bg-blue-50/30 transition-colors group">
                    <td class="px-6 py-4">
                        <span class="text-xs font-medium text-slate-600">${unitName}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        ${categoryBadge}
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm font-medium text-slate-800 group-hover:text-primary transition-colors">
                            ${item.objek_analisis || '-'}
                        </p>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center justify-center size-8 rounded-lg bg-slate-100 font-bold text-slate-700 text-sm">
                            ${item.bobot || 0}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center justify-center size-8 rounded-lg bg-primary-light font-bold text-primary text-sm">
                            ${item.rank || 0}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center justify-center size-10 rounded-lg bg-emerald-100 font-bold text-emerald-700 text-sm">
                            ${item.score || 0}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button class="text-slate-400 hover:text-primary hover:bg-blue-50 transition-all p-1.5 rounded-lg" onclick="editSwotItem('${item.id}')">
                                <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button class="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded-lg" onclick="deleteSwotItem('${item.id}')">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update table info
        if (tableInfo) {
            const total = state.filteredData.length;
            const showing = Math.min(endIndex, total);
            tableInfo.textContent = `Menampilkan ${startIndex + 1}-${showing} dari ${total} data`;
        }

        // Update pagination
        updatePagination();
    }

    // Get unit name by ID
    function getUnitName(unitId) {
        const unit = state.unitKerja.find(u => u.id === unitId);
        return unit ? unit.name : 'Unit tidak diketahui';
    }

    // Get category badge
    function getCategoryBadge(category) {
        const badges = {
            'Strength': '<span class="swot-badge strength">S</span>',
            'Weakness': '<span class="swot-badge weakness">W</span>',
            'Opportunity': '<span class="swot-badge opportunity">O</span>',
            'Threat': '<span class="swot-badge threat">T</span>'
        };
        return badges[category] || '<span class="swot-badge">-</span>';
    }

    // Update matrix
    function updateMatrix() {
        const stats = calculateStatistics();
        
        // Update quadrant counts
        const soElement = document.getElementById('soCount');
        const woElement = document.getElementById('woCount');
        const stElement = document.getElementById('stCount');
        const wtElement = document.getElementById('wtCount');
        
        if (soElement) soElement.textContent = `${stats.strength.count + stats.opportunity.count} items`;
        if (woElement) woElement.textContent = `${stats.weakness.count + stats.opportunity.count} items`;
        if (stElement) stElement.textContent = `${stats.strength.count + stats.threat.count} items`;
        if (wtElement) wtElement.textContent = `${stats.weakness.count + stats.threat.count} items`;
    }

    // Update pagination
    function updatePagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(state.filteredData.length / state.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (state.currentPage > 1) {
            paginationHTML += `
                <button class="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50" onclick="modernSwotModule.goToPage(${state.currentPage - 1})">
                    <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
            `;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === state.currentPage) {
                paginationHTML += `
                    <button class="px-3 py-1 text-sm bg-primary text-white rounded-lg">${i}</button>
                `;
            } else {
                paginationHTML += `
                    <button class="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50" onclick="modernSwotModule.goToPage(${i})">${i}</button>
                `;
            }
        }

        // Next button
        if (state.currentPage < totalPages) {
            paginationHTML += `
                <button class="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50" onclick="modernSwotModule.goToPage(${state.currentPage + 1})">
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
            `;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.toLowerCase();
                applyFilters();
            });
        }
    }

    // Apply filters
    function applyFilters() {
        state.filteredData = state.data.filter(item => {
            // Category filter
            if (state.currentFilter !== 'all' && item.kategori !== state.currentFilter) {
                return false;
            }

            // Search filter
            if (state.searchQuery) {
                const searchText = (item.objek_analisis || '').toLowerCase();
                if (!searchText.includes(state.searchQuery)) {
                    return false;
                }
            }

            return true;
        });

        state.currentPage = 1; // Reset to first page
        updateStatistics();
        renderTable();
        updateMatrix();
    }

    // Public methods
    return {
        init,
        refresh: loadData,
        setActiveFilter: (filter) => {
            state.currentFilter = filter;
            applyFilters();
            
            // Update filter buttons
            document.querySelectorAll('.filter-tab').forEach(btn => {
                btn.classList.remove('border-primary', 'text-primary', 'font-bold');
                btn.classList.add('border-transparent', 'text-slate-500', 'font-medium');
            });
            
            const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
            if (activeBtn) {
                activeBtn.classList.add('border-primary', 'text-primary', 'font-bold');
                activeBtn.classList.remove('border-transparent', 'text-slate-500', 'font-medium');
            }
        },
        goToPage: (page) => {
            state.currentPage = page;
            renderTable();
        }
    };
})();

// Initialize when DOM is loaded
let modernSwotModule;
document.addEventListener('DOMContentLoaded', function() {
    modernSwotModule = ModernSwotModule;
    modernSwotModule.init();
});

// Global functions for HTML onclick handlers
function setActiveFilter(filter) {
    if (modernSwotModule) {
        modernSwotModule.setActiveFilter(filter);
    }
}

function filterTable() {
    // Search is handled by event listener in setupEventListeners
}

function showAddModal() {
    alert('Fitur tambah data SWOT akan segera tersedia');
}

function showMatrixInfo() {
    alert('Matriks SWOT menunjukkan distribusi analisis berdasarkan kategori');
}

function showQuadrantDetails(quadrant) {
    const quadrantNames = {
        'SO': 'Strengths-Opportunities (Growth Strategy)',
        'WO': 'Weaknesses-Opportunities (Turnaround Strategy)', 
        'ST': 'Strengths-Threats (Diversification Strategy)',
        'WT': 'Weaknesses-Threats (Defensive Strategy)'
    };
    
    alert(`Detail ${quadrantNames[quadrant] || quadrant}`);
}

function downloadTemplate() {
    alert('Download template Excel akan segera tersedia');
}

function showImportModal() {
    alert('Fitur import data Excel akan segera tersedia');
}

function downloadReport() {
    alert('Export laporan akan segera tersedia');
}

function editSwotItem(id) {
    alert(`Edit item SWOT dengan ID: ${id}`);
}

function deleteSwotItem(id) {
    if (confirm('Apakah Anda yakin ingin menghapus item SWOT ini?')) {
        alert(`Hapus item SWOT dengan ID: ${id}`);
    }
}

// Export for global access
window.modernSwotModule = modernSwotModule;
window.setActiveFilter = setActiveFilter;

console.log('Modern SWOT Analysis module loaded');