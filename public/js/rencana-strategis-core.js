/**
 * RENCANA STRATEGIS CORE MODULE v7.0
 * 
 * SINGLE SOURCE OF TRUTH - Satu-satunya script untuk halaman /rencana-strategis
 * 
 * SOLUSI MASALAH:
 * ✅ Flag untuk mencegah eksekusi berulang
 * ✅ Cleanup event listener sebelum menambah baru
 * ✅ Tidak menggunakan setInterval untuk fix UI
 * ✅ MutationObserver dengan guard yang ketat
 * ✅ Isolasi halaman yang benar
 * 
 * TAMPILAN YANG BENAR:
 * ✅ Statistics Cards (Aktif, Draft, Selesai, Total)
 * ✅ Form Input (collapsible)
 * ✅ Data Table dengan kolom: Kode, Nama, Target, Periode, Status, Aksi
 * 
 * TIDAK BOLEH MENAMPILKAN:
 * ❌ Selection List / "Pilih Rencana Strategis" view
 * 
 * Created: 2026-01-11
 */

(function() {
    'use strict';
    
    // ============================================
    // CRITICAL: SINGLE INSTANCE GUARD
    // ============================================
    const MODULE_ID = 'RSCore_v7_' + Date.now();
    const MODULE_VERSION = '7.0-CORE';
    
    // Prevent multiple instances
    if (window._RSCoreInstance) {
        console.log('[RSCore] Already loaded, skipping duplicate');
        return;
    }
    window._RSCoreInstance = MODULE_ID;
    
    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const state = {
        data: [],
        missions: [],
        currentId: null,
        isLoading: false,
        isInitialized: false,
        showForm: true,
        formValues: {
            kode: '',
            visi_misi_id: '',
            nama_rencana: '',
            deskripsi: '',
            periode_mulai: '',
            periode_selesai: '',
            target: '',
            status: 'Draft'
        },
        // Guards
        loadLock: false,
        lastLoadTime: 0,
        loadCount: 0,
        maxLoadPerMinute: 10,
        // Event tracking
        boundEvents: new Map(),
        // Observer
        observer: null,
        observerActive: false
    };
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    const $ = (id) => document.getElementById(id);
    
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    const truncate = (text, max) => {
        if (!text) return '';
        return text.length > max ? text.substring(0, max) + '...' : text;
    };
    
    const formatDate = (date) => {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('id-ID', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });
        } catch {
            return '-';
        }
    };
    
    // ============================================
    // API HELPER
    // ============================================
    const api = async (endpoint, options = {}) => {
        // Try global apiCall first
        if (window.apiCall && typeof window.apiCall === 'function') {
            return window.apiCall(endpoint, options);
        }
        if (window.app?.apiCall && typeof window.app.apiCall === 'function') {
            return window.app.apiCall(endpoint, options);
        }
        
        // Fallback to direct fetch
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };
        
        const config = { ...options, headers };
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }
        
        const response = await fetch(endpoint, config);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    };
    
    // ============================================
    // PAGE DETECTION
    // ============================================
    const isOnRSPage = () => {
        const path = window.location.pathname;
        const hash = window.location.hash;
        return path === '/rencana-strategis' || 
               path.includes('/rencana-strategis') ||
               hash === '#rencana-strategis' ||
               hash.includes('rencana-strategis');
    };
    
    // ============================================
    // EVENT MANAGEMENT - CRITICAL FIX
    // ============================================
    
    /**
     * CRITICAL: Remove old event listeners before adding new ones
     */
    const removeAllEvents = () => {
        state.boundEvents.forEach((handler, element) => {
            if (element && handler) {
                element.removeEventListener(handler.type, handler.fn);
            }
        });
        state.boundEvents.clear();
    };
    
    /**
     * Add event listener with tracking
     */
    const addEvent = (element, type, handler) => {
        if (!element) return;
        
        // Remove existing handler for this element/type combo
        const key = `${element.id || 'el'}_${type}`;
        const existing = state.boundEvents.get(key);
        if (existing) {
            element.removeEventListener(type, existing.fn);
        }
        
        // Add new handler
        element.addEventListener(type, handler);
        state.boundEvents.set(key, { element, type, fn: handler });
    };
    
    // ============================================
    // OBSERVER MANAGEMENT - CRITICAL FIX
    // ============================================
    
    /**
     * CRITICAL: Stop any existing observer before creating new one
     */
    const stopObserver = () => {
        if (state.observer) {
            state.observer.disconnect();
            state.observer = null;
            state.observerActive = false;
            console.log('[RSCore] Observer stopped');
        }
    };
    
    /**
     * Start observer with strict guards
     * Only runs ONCE and auto-disconnects after timeout
     */
    const startObserver = (container) => {
        // Don't start if already active
        if (state.observerActive || state.observer) {
            return;
        }
        
        let fixCount = 0;
        const MAX_FIXES = 3;
        
        state.observer = new MutationObserver((mutations) => {
            // Guard: Check if we're still on RS page
            if (!isOnRSPage()) {
                stopObserver();
                return;
            }
            
            // Guard: Check if content is correct
            const html = container.innerHTML;
            const hasCorrectContent = html.includes('rencana-strategis-wrapper') && 
                                     (container.querySelector('table') || html.includes('rs-form'));
            
            if (hasCorrectContent) {
                return; // Content is fine, do nothing
            }
            
            // Guard: Limit fixes
            if (fixCount >= MAX_FIXES) {
                console.warn('[RSCore] Max fixes reached, stopping observer');
                stopObserver();
                return;
            }
            
            // Check for wrong content (selection list)
            const hasWrongContent = html.includes('Pilih Rencana Strategis') || 
                                   (html.includes('list-group') && /RS-\d{4}-\d{3}/.test(html));
            
            if (hasWrongContent) {
                fixCount++;
                console.warn(`[RSCore] Wrong content detected, fixing (${fixCount}/${MAX_FIXES})...`);
                render();
            }
        });
        
        state.observer.observe(container, {
            childList: true,
            subtree: false
        });
        
        state.observerActive = true;
        
        // Auto-disconnect after 5 seconds
        setTimeout(() => {
            stopObserver();
        }, 5000);
    };

    
    // ============================================
    // DATA FETCHING
    // ============================================
    
    const fetchData = async () => {
        try {
            const [rencanaRes, visiRes] = await Promise.allSettled([
                api('/api/rencana-strategis').catch(() => 
                    api('/api/rencana-strategis/public').catch(() => [])
                ),
                api('/api/visi-misi').catch(() => 
                    api('/api/visi-misi/public').catch(() => [])
                )
            ]);
            
            // Process rencana data
            if (rencanaRes.status === 'fulfilled') {
                const val = rencanaRes.value;
                state.data = Array.isArray(val) ? val : (val?.data || []);
            } else {
                state.data = [];
            }
            
            // Process visi-misi data
            if (visiRes.status === 'fulfilled') {
                const val = visiRes.value;
                state.missions = Array.isArray(val) ? val : (val?.data || []);
            } else {
                state.missions = [];
            }
            
            console.log(`[RSCore] Data: ${state.data.length} rencana, ${state.missions.length} misi`);
            
        } catch (error) {
            console.error('[RSCore] Error fetching data:', error);
            state.data = [];
            state.missions = [];
        }
    };
    
    const generateKode = async () => {
        try {
            const response = await api('/api/rencana-strategis/generate/kode/public');
            state.formValues.kode = response.kode || response || '';
        } catch (error) {
            const year = new Date().getFullYear();
            const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
            state.formValues.kode = `RS-${year}-${random}`;
        }
    };
    
    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    
    const renderStatCards = () => {
        const counts = {
            aktif: state.data.filter(i => i.status === 'Aktif').length,
            draft: state.data.filter(i => i.status === 'Draft').length,
            selesai: state.data.filter(i => i.status === 'Selesai').length,
            total: state.data.length
        };
        
        const cards = [
            { label: 'Rencana Aktif', count: counts.aktif, icon: 'fa-check-circle', gradient: '#28a745, #20c997', textColor: 'text-success' },
            { label: 'Draft', count: counts.draft, icon: 'fa-edit', gradient: '#ffc107, #fd7e14', textColor: 'text-warning' },
            { label: 'Selesai', count: counts.selesai, icon: 'fa-flag-checkered', gradient: '#007bff, #6f42c1', textColor: 'text-primary' },
            { label: 'Total Rencana', count: counts.total, icon: 'fa-list-alt', gradient: '#6c757d, #495057', textColor: 'text-secondary' }
        ];
        
        return `
            <div class="row g-3 mb-4">
                ${cards.map(card => `
                    <div class="col-xl-3 col-md-6 col-sm-6">
                        <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; overflow: hidden;">
                            <div class="card-body p-0">
                                <div class="d-flex align-items-center">
                                    <div class="flex-shrink-0 d-flex align-items-center justify-content-center" 
                                         style="width: 80px; height: 100px; background: linear-gradient(135deg, ${card.gradient});">
                                        <i class="fas ${card.icon} fa-2x text-white"></i>
                                    </div>
                                    <div class="flex-grow-1 p-3">
                                        <h3 class="fw-bold ${card.textColor} mb-0">${card.count}</h3>
                                        <p class="text-muted mb-0 small">${card.label}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };
    
    const renderForm = () => {
        const f = state.formValues;
        const isEdit = !!state.currentId;
        const isCollapsed = !state.showForm;
        
        // Build mission options
        let missionOptions = '<option value="">-- Pilih Misi --</option>';
        state.missions.forEach(m => {
            if (!m.misi) return;
            m.misi.split('\n').filter(x => x.trim()).forEach((misi, idx) => {
                const clean = misi.replace(/^\d+\.\s*/, '').trim();
                const value = `${m.id}|${idx}|${encodeURIComponent(clean)}`;
                const selected = f.visi_misi_id === value ? 'selected' : '';
                missionOptions += `<option value="${value}" ${selected}>${truncate(clean, 80)}</option>`;
            });
        });
        
        return `
            <div class="card mb-4 shadow-sm border-0" id="rs-form-section" style="border-radius: 12px;">
                <div class="card-header text-white d-flex justify-content-between align-items-center" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                    <h5 class="mb-0">
                        <i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} me-2"></i>
                        ${isEdit ? 'Edit Rencana Strategis' : 'Form Input Rencana Strategis'}
                    </h5>
                    <button type="button" class="btn btn-light btn-sm" id="rs-toggle-form">
                        <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
                    </button>
                </div>
                <div class="card-body bg-white${isCollapsed ? ' d-none' : ''}" id="rs-form-body">
                    <form id="rs-form" autocomplete="off">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label fw-semibold"><i class="fas fa-barcode me-1 text-primary"></i> Kode</label>
                                <input type="text" class="form-control bg-light" id="rs-kode" value="${escapeHtml(f.kode)}" readonly>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label fw-semibold"><i class="fas fa-flag me-1 text-warning"></i> Status</label>
                                <select class="form-select" id="rs-status">
                                    <option value="Draft" ${f.status === 'Draft' ? 'selected' : ''}>📝 Draft</option>
                                    <option value="Aktif" ${f.status === 'Aktif' ? 'selected' : ''}>✅ Aktif</option>
                                    <option value="Selesai" ${f.status === 'Selesai' ? 'selected' : ''}>🏁 Selesai</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold"><i class="fas fa-bullseye me-1 text-success"></i> Misi Terkait</label>
                                <select class="form-select" id="rs-misi">${missionOptions}</select>
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold"><i class="fas fa-file-alt me-1 text-info"></i> Nama Rencana Strategis <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-lg" id="rs-nama" value="${escapeHtml(f.nama_rencana)}" placeholder="Masukkan nama rencana strategis..." required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold"><i class="fas fa-calendar-alt me-1 text-primary"></i> Periode Mulai</label>
                                <input type="date" class="form-control" id="rs-mulai" value="${f.periode_mulai || ''}">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold"><i class="fas fa-calendar-check me-1 text-success"></i> Periode Selesai</label>
                                <input type="date" class="form-control" id="rs-selesai" value="${f.periode_selesai || ''}">
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold"><i class="fas fa-align-left me-1 text-secondary"></i> Deskripsi</label>
                                <textarea class="form-control" id="rs-deskripsi" rows="3" placeholder="Masukkan deskripsi...">${escapeHtml(f.deskripsi)}</textarea>
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold"><i class="fas fa-crosshairs me-1 text-danger"></i> Target</label>
                                <textarea class="form-control" id="rs-target" rows="2" placeholder="Masukkan target...">${escapeHtml(f.target)}</textarea>
                            </div>
                            <div class="col-12 pt-3 border-top">
                                <div class="d-flex gap-2 flex-wrap">
                                    <button type="submit" class="btn btn-primary btn-lg">
                                        <i class="fas fa-save me-2"></i>${isEdit ? 'Update Data' : 'Simpan Data'}
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" id="rs-reset-btn">
                                        <i class="fas fa-undo me-2"></i>Reset
                                    </button>
                                    ${isEdit ? `
                                        <button type="button" class="btn btn-outline-danger" id="rs-cancel-edit">
                                            <i class="fas fa-times me-2"></i>Batal Edit
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    };

    
    const renderTable = () => {
        let rows = '';
        
        if (state.data.length === 0) {
            rows = `
                <tr>
                    <td colspan="6" class="text-center py-5 border-0">
                        <div class="py-4">
                            <div class="mb-3" style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-inbox fa-2x text-muted"></i>
                            </div>
                            <h5 class="text-muted mb-2">Belum Ada Data</h5>
                            <p class="text-muted mb-3">Silakan isi form di atas untuk menambahkan rencana strategis baru</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            rows = state.data.map((item, idx) => {
                const statusBadges = {
                    'Aktif': '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>',
                    'Draft': '<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i>Draft</span>',
                    'Selesai': '<span class="badge bg-secondary"><i class="fas fa-flag-checkered me-1"></i>Selesai</span>'
                };
                const statusBadge = statusBadges[item.status] || '<span class="badge bg-light text-dark">-</span>';
                const periode = `${formatDate(item.periode_mulai)} - ${formatDate(item.periode_selesai)}`;
                const rowBg = idx % 2 === 0 ? '' : 'style="background-color: #fafbfc;"';
                
                return `
                    <tr ${rowBg}>
                        <td class="align-middle">
                            <span class="badge bg-light text-dark border fw-normal px-2 py-1">${escapeHtml(item.kode) || '-'}</span>
                        </td>
                        <td class="align-middle">
                            <div class="fw-semibold text-dark">${escapeHtml(item.nama_rencana) || '-'}</div>
                            ${item.deskripsi ? `<small class="text-muted d-block mt-1">${truncate(escapeHtml(item.deskripsi), 80)}</small>` : ''}
                        </td>
                        <td class="align-middle">
                            <small class="text-muted">${truncate(escapeHtml(item.target) || '-', 50)}</small>
                        </td>
                        <td class="align-middle">
                            <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i>${periode}</small>
                        </td>
                        <td class="align-middle">${statusBadge}</td>
                        <td class="align-middle text-center">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-info border-0 rs-view-btn" data-id="${item.id}" title="Lihat Detail">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-warning border-0 rs-edit-btn" data-id="${item.id}" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger border-0 rs-delete-btn" data-id="${item.id}" title="Hapus">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        return `
            <div class="card shadow-sm border-0" style="border-radius: 12px;">
                <div class="card-header bg-white d-flex justify-content-between align-items-center py-3 flex-wrap gap-2" style="border-radius: 12px 12px 0 0;">
                    <div>
                        <h5 class="mb-0"><i class="fas fa-table text-primary me-2"></i>Daftar Rencana Strategis</h5>
                        <small class="text-muted">Total: ${state.data.length} data</small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary" id="rs-refresh-btn">
                            <i class="fas fa-sync-alt me-1"></i>Refresh
                        </button>
                        <button class="btn btn-outline-success" id="rs-export-btn">
                            <i class="fas fa-file-excel me-1"></i>Export
                        </button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                                <tr>
                                    <th class="border-0 py-3" style="width: 120px;"><i class="fas fa-barcode me-1 text-muted"></i>Kode</th>
                                    <th class="border-0 py-3"><i class="fas fa-file-alt me-1 text-muted"></i>Nama Rencana</th>
                                    <th class="border-0 py-3" style="width: 150px;"><i class="fas fa-crosshairs me-1 text-muted"></i>Target</th>
                                    <th class="border-0 py-3" style="width: 180px;"><i class="fas fa-calendar me-1 text-muted"></i>Periode</th>
                                    <th class="border-0 py-3" style="width: 100px;"><i class="fas fa-flag me-1 text-muted"></i>Status</th>
                                    <th class="border-0 py-3 text-center" style="width: 120px;"><i class="fas fa-cogs me-1 text-muted"></i>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    };
    
    const render = () => {
        const container = $('rencana-strategis-content');
        if (!container) return;
        
        // CRITICAL: Remove old events before re-rendering
        removeAllEvents();
        
        container.innerHTML = `
            <div class="rencana-strategis-wrapper p-3" style="background: #f8f9fa; min-height: 100%;">
                ${renderStatCards()}
                ${renderForm()}
                ${renderTable()}
            </div>
        `;
        
        // Mark as rendered
        container.setAttribute('data-rs-core', MODULE_ID);
        container.setAttribute('data-rs-version', MODULE_VERSION);
        container.setAttribute('data-rs-rendered', 'true');
        
        // Bind events
        bindEvents();
        
        console.log('[RSCore] Rendered: Statistics + Form + Table');
    };
    
    // ============================================
    // EVENT HANDLERS
    // ============================================
    
    const bindEvents = () => {
        // Form submit
        const form = $('rs-form');
        if (form) {
            addEvent(form, 'submit', handleSubmit);
        }
        
        // Toggle form
        const toggleBtn = $('rs-toggle-form');
        if (toggleBtn) {
            addEvent(toggleBtn, 'click', toggleForm);
        }
        
        // Reset form
        const resetBtn = $('rs-reset-btn');
        if (resetBtn) {
            addEvent(resetBtn, 'click', resetForm);
        }
        
        // Cancel edit
        const cancelBtn = $('rs-cancel-edit');
        if (cancelBtn) {
            addEvent(cancelBtn, 'click', cancelEdit);
        }
        
        // Refresh
        const refreshBtn = $('rs-refresh-btn');
        if (refreshBtn) {
            addEvent(refreshBtn, 'click', refresh);
        }
        
        // Export
        const exportBtn = $('rs-export-btn');
        if (exportBtn) {
            addEvent(exportBtn, 'click', exportData);
        }
        
        // Table action buttons - use event delegation
        const container = $('rencana-strategis-content');
        if (container) {
            addEvent(container, 'click', handleTableActions);
        }
    };
    
    const handleTableActions = (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const id = target.dataset.id;
        if (!id) return;
        
        if (target.classList.contains('rs-view-btn')) {
            viewDetail(id);
        } else if (target.classList.contains('rs-edit-btn')) {
            edit(id);
        } else if (target.classList.contains('rs-delete-btn')) {
            deleteRecord(id);
        }
    };
    
    const toggleForm = () => {
        state.showForm = !state.showForm;
        const body = $('rs-form-body');
        const btn = $('rs-toggle-form');
        
        if (body) {
            body.classList.toggle('d-none', !state.showForm);
        }
        if (btn) {
            btn.innerHTML = `<i class="fas fa-chevron-${state.showForm ? 'up' : 'down'}"></i>`;
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            kode: $('rs-kode')?.value || '',
            visi_misi_id: ($('rs-misi')?.value || '').split('|')[0] || null,
            nama_rencana: $('rs-nama')?.value || '',
            deskripsi: $('rs-deskripsi')?.value || '',
            periode_mulai: $('rs-mulai')?.value || null,
            periode_selesai: $('rs-selesai')?.value || null,
            target: $('rs-target')?.value || '',
            status: $('rs-status')?.value || 'Draft'
        };
        
        if (!formData.nama_rencana.trim()) {
            alert('Nama rencana strategis wajib diisi!');
            $('rs-nama')?.focus();
            return;
        }
        
        try {
            if (state.currentId) {
                await api(`/api/rencana-strategis/${state.currentId}`, { 
                    method: 'PUT', 
                    body: formData 
                });
                alert('Data berhasil diupdate!');
            } else {
                await api('/api/rencana-strategis', { 
                    method: 'POST', 
                    body: formData 
                });
                alert('Data berhasil disimpan!');
            }
            
            // Reset and refresh
            state.currentId = null;
            state.formValues = {
                kode: '',
                visi_misi_id: '',
                nama_rencana: '',
                deskripsi: '',
                periode_mulai: '',
                periode_selesai: '',
                target: '',
                status: 'Draft'
            };
            
            await refresh();
            
        } catch (error) {
            console.error('[RSCore] Error saving:', error);
            alert('Gagal menyimpan data: ' + error.message);
        }
    };
    
    const resetForm = () => {
        state.currentId = null;
        state.formValues = {
            kode: '',
            visi_misi_id: '',
            nama_rencana: '',
            deskripsi: '',
            periode_mulai: '',
            periode_selesai: '',
            target: '',
            status: 'Draft'
        };
        generateKode().then(render);
    };
    
    const cancelEdit = () => {
        resetForm();
    };
    
    const refresh = async () => {
        console.log('[RSCore] Refreshing data...');
        await fetchData();
        await generateKode();
        render();
    };
    
    const exportData = () => {
        if (state.data.length === 0) {
            alert('Tidak ada data untuk di-export');
            return;
        }
        
        // Simple CSV export
        const headers = ['Kode', 'Nama Rencana', 'Deskripsi', 'Target', 'Periode Mulai', 'Periode Selesai', 'Status'];
        const rows = state.data.map(item => [
            item.kode || '',
            item.nama_rencana || '',
            (item.deskripsi || '').replace(/"/g, '""'),
            (item.target || '').replace(/"/g, '""'),
            item.periode_mulai || '',
            item.periode_selesai || '',
            item.status || ''
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rencana-strategis-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    
    // ============================================
    // CRUD OPERATIONS
    // ============================================
    
    const edit = (id) => {
        const record = state.data.find(i => i.id === id);
        if (!record) {
            alert('Data tidak ditemukan');
            return;
        }
        
        state.currentId = id;
        state.formValues = { ...record };
        state.showForm = true;
        
        render();
        
        // Scroll to form
        setTimeout(() => {
            const formSection = $('rs-form-section');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            $('rs-nama')?.focus();
        }, 100);
    };
    
    const deleteRecord = async (id) => {
        const record = state.data.find(i => i.id === id);
        const name = record?.nama_rencana || 'data ini';
        
        if (!confirm(`Yakin ingin menghapus "${name}"?`)) {
            return;
        }
        
        try {
            await api(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
            alert('Data berhasil dihapus!');
            await refresh();
        } catch (error) {
            console.error('[RSCore] Error deleting:', error);
            alert('Gagal menghapus data: ' + error.message);
        }
    };
    
    const viewDetail = (id) => {
        const record = state.data.find(i => i.id === id);
        if (!record) {
            alert('Data tidak ditemukan');
            return;
        }
        
        const statusBadges = {
            'Aktif': '<span class="badge bg-success">Aktif</span>',
            'Draft': '<span class="badge bg-warning text-dark">Draft</span>',
            'Selesai': '<span class="badge bg-secondary">Selesai</span>'
        };
        
        // Remove existing modal
        const existingModal = document.getElementById('rs-detail-modal');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = `
            <div class="modal fade show" id="rs-detail-modal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <h5 class="modal-title text-white"><i class="fas fa-info-circle me-2"></i>Detail Rencana Strategis</h5>
                            <button type="button" class="btn-close btn-close-white" id="rs-modal-close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label text-muted small">Kode</label>
                                    <p class="fw-semibold">${escapeHtml(record.kode) || '-'}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-muted small">Status</label>
                                    <p>${statusBadges[record.status] || '-'}</p>
                                </div>
                                <div class="col-12">
                                    <label class="form-label text-muted small">Nama Rencana</label>
                                    <p class="fw-semibold fs-5">${escapeHtml(record.nama_rencana) || '-'}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-muted small">Periode Mulai</label>
                                    <p>${formatDate(record.periode_mulai)}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-muted small">Periode Selesai</label>
                                    <p>${formatDate(record.periode_selesai)}</p>
                                </div>
                                <div class="col-12">
                                    <label class="form-label text-muted small">Deskripsi</label>
                                    <p class="bg-light p-3 rounded">${escapeHtml(record.deskripsi) || '-'}</p>
                                </div>
                                <div class="col-12">
                                    <label class="form-label text-muted small">Target</label>
                                    <p class="bg-light p-3 rounded">${escapeHtml(record.target) || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-warning" id="rs-modal-edit" data-id="${id}">
                                <i class="fas fa-edit me-1"></i>Edit
                            </button>
                            <button type="button" class="btn btn-secondary" id="rs-modal-close-btn">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalDiv.firstElementChild);
        
        // Bind modal events
        const modal = document.getElementById('rs-detail-modal');
        const closeModal = () => modal?.remove();
        
        document.getElementById('rs-modal-close')?.addEventListener('click', closeModal);
        document.getElementById('rs-modal-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('rs-modal-edit')?.addEventListener('click', () => {
            closeModal();
            edit(id);
        });
        
        // Close on backdrop click
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    };
    
    // ============================================
    // MAIN LOAD FUNCTION
    // ============================================
    
    const load = async () => {
        // Guard: Check if on RS page
        if (!isOnRSPage()) {
            console.log('[RSCore] Not on RS page, skipping');
            return;
        }
        
        // Guard: Prevent concurrent loads
        if (state.loadLock) {
            console.log('[RSCore] Load locked, skipping');
            return;
        }
        
        // Guard: Rate limiting
        const now = Date.now();
        if (now - state.lastLoadTime < 500) {
            console.log('[RSCore] Rate limited, skipping');
            return;
        }
        
        // Guard: Max loads per minute
        if (state.loadCount > state.maxLoadPerMinute) {
            const timeSinceFirst = now - state.lastLoadTime;
            if (timeSinceFirst < 60000) {
                console.warn('[RSCore] Too many loads, waiting...');
                return;
            }
            state.loadCount = 0;
        }
        
        // Set locks
        state.loadLock = true;
        state.isLoading = true;
        state.lastLoadTime = now;
        state.loadCount++;
        
        console.log(`[RSCore] Loading v${MODULE_VERSION} (load #${state.loadCount})...`);
        
        const container = $('rencana-strategis-content');
        if (!container) {
            console.error('[RSCore] Container not found');
            state.loadLock = false;
            state.isLoading = false;
            return;
        }
        
        // Show loading
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Memuat data rencana strategis...</p>
            </div>
        `;
        
        try {
            // Stop any existing observer
            stopObserver();
            
            // Fetch data
            await fetchData();
            
            // Generate code if needed
            if (!state.formValues.kode) {
                await generateKode();
            }
            
            // Render
            render();
            
            // Start observer with guards
            startObserver(container);
            
            state.isInitialized = true;
            console.log(`[RSCore] Loaded successfully v${MODULE_VERSION}`);
            
        } catch (error) {
            console.error('[RSCore] Error loading:', error);
            container.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Gagal memuat data:</strong> ${escapeHtml(error.message)}
                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="window.RSCore.load()">
                        <i class="fas fa-redo me-1"></i>Coba Lagi
                    </button>
                </div>
            `;
        } finally {
            state.isLoading = false;
            // Release lock after delay
            setTimeout(() => { state.loadLock = false; }, 300);
        }
    };
    
    // ============================================
    // CLEANUP
    // ============================================
    
    const cleanup = () => {
        console.log('[RSCore] Cleaning up...');
        
        // Stop observer
        stopObserver();
        
        // Remove all events
        removeAllEvents();
        
        // Reset state
        state.isInitialized = false;
        state.isLoading = false;
        state.loadLock = false;
        state.currentId = null;
        
        // Clear instance marker
        delete window._RSCoreInstance;
    };
    
    // ============================================
    // NAVIGATION HANDLER
    // ============================================
    
    const handleNavigation = () => {
        if (isOnRSPage()) {
            // Delay to ensure DOM is ready
            setTimeout(() => {
                if (!state.isInitialized || !$('rencana-strategis-content')?.querySelector('.rencana-strategis-wrapper')) {
                    load();
                }
            }, 100);
        } else {
            // Cleanup when leaving page
            cleanup();
        }
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    window.RSCore = {
        load,
        refresh,
        edit,
        delete: deleteRecord,
        viewDetail,
        cleanup,
        version: MODULE_VERSION,
        getState: () => ({ ...state })
    };
    
    // Compatibility aliases
    window.RencanaStrategisModule = window.RSCore;
    window.RencanaStrategisFast = window.RSCore;
    window.RencanaStrategisCore = window.RSCore;
    
    console.log(`[RSCore] Module v${MODULE_VERSION} registered`);
    
    // Auto-load if on RS page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isOnRSPage()) load();
        });
    } else {
        if (isOnRSPage()) {
            setTimeout(load, 50);
        }
    }
    
})();
