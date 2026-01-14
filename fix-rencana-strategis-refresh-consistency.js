/**
 * Fix for Rencana Strategis Display Model Refresh Consistency
 * This script addresses the issue where the display model changes on page refresh
 */

const fs = require('fs');
const path = require('path');

function fixRencanaStrategisRefreshConsistency() {
  console.log('=== FIXING RENCANA STRATEGIS REFRESH CONSISTENCY ===');
  
  try {
    // 1. Create enhanced router state management
    const routerStateManagerCode = `
/**
 * Enhanced Router State Manager for Rencana Strategis
 * Ensures consistent display model across page refreshes
 */
class RencanaStrategisStateManager {
  constructor() {
    this.stateKey = 'rencana_strategis_state';
    this.displayModelKey = 'rencana_strategis_display_model';
    this.lastUpdateKey = 'rencana_strategis_last_update';
  }
  
  /**
   * Save current state to prevent refresh issues
   */
  saveState(state) {
    try {
      const stateData = {
        ...state,
        timestamp: Date.now(),
        url: window.location.href,
        displayModel: this.getCurrentDisplayModel()
      };
      
      sessionStorage.setItem(this.stateKey, JSON.stringify(stateData));
      sessionStorage.setItem(this.lastUpdateKey, Date.now().toString());
      
      console.log('✅ Rencana Strategis state saved for refresh consistency');
    } catch (error) {
      console.warn('⚠️ Failed to save rencana strategis state:', error);
    }
  }
  
  /**
   * Restore state after page refresh
   */
  restoreState() {
    try {
      const stateJson = sessionStorage.getItem(this.stateKey);
      const lastUpdate = sessionStorage.getItem(this.lastUpdateKey);
      
      if (stateJson && lastUpdate) {
        const state = JSON.parse(stateJson);
        const age = Date.now() - parseInt(lastUpdate);
        
        // Only restore if state is recent (within 30 seconds)
        if (age < 30000) {
          console.log('✅ Restoring rencana strategis state from refresh');
          return state;
        } else {
          console.log('⚠️ Rencana strategis state too old, clearing');
          this.clearState();
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore rencana strategis state:', error);
    }
    
    return null;
  }
  
  /**
   * Get current display model
   */
  getCurrentDisplayModel() {
    const formSection = document.getElementById('form-section');
    const tableSection = document.getElementById('table-section');
    
    return {
      formVisible: formSection ? !formSection.style.display || formSection.style.display !== 'none' : true,
      tableVisible: tableSection ? !tableSection.style.display || tableSection.style.display !== 'none' : true,
      editMode: !!document.querySelector('#rs-cancel-edit'),
      currentId: window.RencanaStrategisModule?.state?.currentId || null
    };
  }
  
  /**
   * Apply display model to ensure consistency
   */
  applyDisplayModel(displayModel) {
    if (!displayModel) return;
    
    try {
      const formSection = document.getElementById('form-section');
      const tableSection = document.getElementById('table-section');
      
      if (formSection) {
        formSection.style.display = displayModel.formVisible ? 'block' : 'none';
      }
      
      if (tableSection) {
        tableSection.style.display = displayModel.tableVisible ? 'block' : 'none';
      }
      
      // Restore edit mode if needed
      if (displayModel.editMode && displayModel.currentId) {
        if (window.RencanaStrategisModule?.state) {
          window.RencanaStrategisModule.state.currentId = displayModel.currentId;
        }
      }
      
      console.log('✅ Display model applied for consistency');
    } catch (error) {
      console.warn('⚠️ Failed to apply display model:', error);
    }
  }
  
  /**
   * Clear stored state
   */
  clearState() {
    sessionStorage.removeItem(this.stateKey);
    sessionStorage.removeItem(this.lastUpdateKey);
    sessionStorage.removeItem(this.displayModelKey);
  }
  
  /**
   * Monitor for state changes and auto-save
   */
  startMonitoring() {
    // Save state on form changes
    const observer = new MutationObserver(() => {
      if (window.RencanaStrategisModule?.state) {
        this.saveState(window.RencanaStrategisModule.state);
      }
    });
    
    // Observe form section for changes
    const formSection = document.getElementById('form-section');
    if (formSection) {
      observer.observe(formSection, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
    
    // Save state before page unload
    window.addEventListener('beforeunload', () => {
      if (window.RencanaStrategisModule?.state) {
        this.saveState(window.RencanaStrategisModule.state);
      }
    });
  }
}

// Make available globally
window.RencanaStrategisStateManager = RencanaStrategisStateManager;
`;

    // 2. Create enhanced rencana strategis module with refresh consistency
    const enhancedModuleCode = `
// Enhanced Rencana Strategis Module with Refresh Consistency
const RencanaStrategisModuleEnhanced = (() => {
  const state = {
    data: [],
    missions: [],
    currentId: null,
    formValues: getDefaultForm(),
    sasaranList: [],
    indikatorList: [],
    displayModel: 'default', // Track current display model
    isRefresh: false
  };

  const stateManager = new RencanaStrategisStateManager();
  const api = () => (window.app ? window.app.apiCall : window.apiCall);
  const getEl = (id) => document.getElementById(id);

  function getDefaultForm() {
    return {
      kode: '',
      visi_misi_id: '',
      nama_rencana: '',
      deskripsi: '',
      periode_mulai: '',
      periode_selesai: '',
      target: '',
      indikator_kinerja: '',
      status: 'Draft'
    };
  }

  async function load() {
    console.log('[ENHANCED] Rencana Strategis Module load start');
    
    // Check if this is a page refresh
    const isPageRefresh = window.performance && 
        window.performance.navigation && 
        window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD;
    
    state.isRefresh = isPageRefresh;
    
    if (isPageRefresh) {
      console.log('🔄 Page refresh detected, attempting state restoration...');
      
      // Try to restore previous state
      const restoredState = stateManager.restoreState();
      if (restoredState) {
        console.log('✅ State restored from refresh');
        
        // Merge restored state
        Object.assign(state, {
          ...restoredState,
          isRefresh: true
        });
        
        // Apply display model immediately
        setTimeout(() => {
          stateManager.applyDisplayModel(restoredState.displayModel);
        }, 100);
      }
    }
    
    // CRITICAL: Wait for auth to be ready
    if (window.waitForAuthReady) {
      const authReady = await window.waitForAuthReady(5000);
      if (!authReady && !window.isAuthenticated) {
        console.warn('[ENHANCED] Auth not ready, aborting load');
        return;
      }
    }
    
    // CRITICAL: Check if page is active
    const rencanaPage = document.getElementById('rencana-strategis');
    if (!rencanaPage || !rencanaPage.classList.contains('active')) {
      console.warn('[ENHANCED] Rencana strategis page not active, aborting load');
      return;
    }
    
    try {
      // Wait for Supabase client
      if (window.SupabaseClientManager) {
        try {
          await window.SupabaseClientManager.waitForClient(10000);
        } catch (error) {
          console.warn('[ENHANCED] Supabase client not ready:', error);
        }
      }
      
      // Fetch data (unless restored from refresh)
      if (!state.isRefresh || state.data.length === 0) {
        console.log('[ENHANCED] Fetching fresh data...');
        await fetchInitialData();
      } else {
        console.log('[ENHANCED] Using restored data from refresh');
      }
      
      // Generate kode if needed
      if (!state.currentId && !state.formValues.kode) {
        await generateKode();
      }
      
      // Render with consistency checks
      renderWithConsistencyCheck();
      
      // Start state monitoring
      stateManager.startMonitoring();
      
      console.log('[ENHANCED] Rencana Strategis Module load complete');
    } catch (error) {
      console.error('[ENHANCED] Load error:', error);
      handleLoadError(error);
    }
  }

  function renderWithConsistencyCheck() {
    console.log('[ENHANCED] Rendering with consistency check...');
    
    // Store current display model before render
    const currentDisplayModel = stateManager.getCurrentDisplayModel();
    
    // Perform normal render
    render();
    
    // Apply consistency check after render
    setTimeout(() => {
      if (state.isRefresh && currentDisplayModel) {
        console.log('[ENHANCED] Applying consistency check after refresh render');
        stateManager.applyDisplayModel(currentDisplayModel);
      }
      
      // Save current state
      stateManager.saveState(state);
    }, 50);
  }

  function render() {
    console.log('[ENHANCED] Starting render process...');
    
    let container = findContainer();
    
    if (!container) {
      console.error('[ENHANCED] Container not found, implementing retry strategy...');
      
      let retryCount = 0;
      const maxRetries = 10;
      
      const retryRender = () => {
        retryCount++;
        console.log(\`[ENHANCED] Retry \${retryCount}/\${maxRetries}: Looking for container...\`);
        
        container = findContainer();
        
        if (container) {
          console.log(\`[ENHANCED] Container found on retry \${retryCount}, rendering...\`);
          renderContent(container);
        } else if (retryCount < maxRetries) {
          const delay = Math.min(100 * Math.pow(2, retryCount - 1), 2000);
          setTimeout(retryRender, delay);
        } else {
          console.error('[ENHANCED] Container not found after all retries, creating fallback...');
          createFallbackContainer();
        }
      };
      
      setTimeout(retryRender, 100);
      return;
    }
    
    console.log('[ENHANCED] Container found immediately, rendering...');
    renderContent(container);
  }

  function findContainer() {
    // Enhanced container finding with multiple strategies
    const strategies = [
      () => document.getElementById('rencana-strategis-content'),
      () => document.getElementById('rencana-strategis'),
      () => document.querySelector('#rencana-strategis .page-content'),
      () => document.querySelector('.page-content.active'),
      () => document.querySelector('#rencana-strategis')
    ];
    
    for (const strategy of strategies) {
      try {
        const container = strategy();
        if (container) {
          console.log('[ENHANCED] Container found with strategy');
          return container;
        }
      } catch (error) {
        console.warn('[ENHANCED] Container strategy failed:', error);
      }
    }
    
    return null;
  }

  function createFallbackContainer() {
    console.log('[ENHANCED] Creating fallback container...');
    
    const rencanaPage = document.getElementById('rencana-strategis');
    if (rencanaPage) {
      let contentContainer = rencanaPage.querySelector('#rencana-strategis-content');
      if (!contentContainer) {
        contentContainer = document.createElement('div');
        contentContainer.id = 'rencana-strategis-content';
        contentContainer.className = 'container-fluid';
        
        const pageHeader = rencanaPage.querySelector('.page-header');
        if (pageHeader) {
          pageHeader.insertAdjacentElement('afterend', contentContainer);
        } else {
          rencanaPage.appendChild(contentContainer);
        }
        
        console.log('[ENHANCED] Fallback container created successfully');
        renderContent(contentContainer);
      }
    } else {
      console.error('[ENHANCED] Cannot create fallback - rencana-strategis page not found');
    }
  }

  function renderContent(container) {
    console.log('[ENHANCED] Rendering content with consistency preservation...');
    
    // Preserve current display state
    const preserveState = {
      formVisible: true,
      tableVisible: !state.currentId,
      editMode: !!state.currentId
    };
    
    // If this is a refresh, try to preserve the previous display model
    if (state.isRefresh) {
      const restoredDisplayModel = stateManager.getCurrentDisplayModel();
      if (restoredDisplayModel) {
        Object.assign(preserveState, restoredDisplayModel);
      }
    }
    
    // Render form section
    const formSection = \`
      <div class="card mb-4" id="form-section" style="display: \${preserveState.formVisible ? 'block' : 'none'}">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="card-title">\${state.currentId ? 'Edit Rencana Strategis' : 'Tambah Rencana Strategis'}</h3>
              <p class="text-muted mb-0">Hubungkan sasaran strategis dengan indikator kinerja utama</p>
            </div>
            <div>
              <span class="badge \${state.currentId ? 'badge-warning' : 'badge-primary'} mr-2">
                \${state.currentId ? 'Mode Edit' : 'Mode Input'}
              </span>
              \${state.currentId ? \`
                <button type="button" class="btn btn-sm btn-secondary" id="rs-cancel-edit">
                  <i class="fas fa-times"></i> Batal Edit
                </button>
              \` : ''}
            </div>
          </div>
        </div>
        <div class="card-body">
          <form id="rs-form" class="form-grid two-column">
            \${renderInput('Kode Rencana', 'rs-kode', 'text', state.formValues.kode, true)}
            \${renderSelect('Misi Strategis', 'rs-misi', state.missions, state.formValues.visi_misi_id)}
            \${renderInput('Nama Rencana Strategis', 'rs-nama', 'text', state.formValues.nama_rencana)}
            \${renderInput('Periode Mulai', 'rs-mulai', 'date', state.formValues.periode_mulai)}
            \${renderInput('Periode Selesai', 'rs-selesai', 'date', state.formValues.periode_selesai)}
            \${renderTextarea('Deskripsi Rencana', 'rs-deskripsi', state.formValues.deskripsi)}
            \${renderTextarea('Target', 'rs-target', state.formValues.target)}
            \${renderStatusSelect('Status', 'rs-status', state.formValues.status || 'Draft')}
            <div class="form-group full-width">
              <label>Indikator Kinerja</label>
              <input type="text" id="rs-indikator" value="\${state.formValues.indikator_kinerja || ''}">
            </div>
            <div class="form-group full-width">
              <label>Tambah Sasaran Strategis</label>
              <div class="input-with-button">
                <input type="text" id="rs-sasaran-input" placeholder="Masukkan sasaran">
                <button type="button" class="btn btn-primary btn-sm" id="rs-sasaran-add"><i class="fas fa-plus"></i></button>
              </div>
              <div class="chip-group" id="rs-sasaran-list">\${renderChipList(state.sasaranList, 'sasaran')}</div>
            </div>
            <div class="form-group full-width">
              <label>Tambah Indikator Kinerja Utama</label>
              <div class="input-with-button">
                <input type="text" id="rs-indikator-input" placeholder="Masukkan indikator">
                <button type="button" class="btn btn-primary btn-sm" id="rs-indikator-add"><i class="fas fa-plus"></i></button>
              </div>
              <div class="chip-group" id="rs-indikator-list">\${renderChipList(state.indikatorList, 'indikator')}</div>
            </div>
            <div class="form-actions full-width">
              <button type="submit" class="btn btn-primary">\${state.currentId ? 'Update' : 'Simpan'} Rencana</button>
              <button type="button" id="rs-reset-btn" class="btn btn-secondary">Reset</button>
            </div>
          </form>
        </div>
      </div>
    \`;

    // Render table section
    const tableSection = \`
      <div class="card" id="table-section" style="display: \${preserveState.tableVisible ? 'block' : 'none'}">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="card-title">Daftar Rencana Strategis</h3>
              <p class="text-muted mb-0">Kelola sasaran strategis dan indikator kinerja utama</p>
            </div>
            <div class="action-group">
              <button class="btn btn-warning btn-sm" id="rs-download-template"><i class="fas fa-download"></i> Template</button>
              <button class="btn btn-success btn-sm" id="rs-import-btn"><i class="fas fa-upload"></i> Import</button>
              <button class="btn btn-info btn-sm" id="rs-export-btn"><i class="fas fa-file-excel"></i> Export</button>
            </div>
          </div>
        </div>
        <div class="card-body p-0">
          <input type="file" id="rs-import-input" hidden accept=".xlsx,.xls">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Rencana & Deskripsi</th>
                  <th>Target</th>
                  <th>Periode</th>
                  <th>Sasaran Strategis</th>
                  <th>Indikator Kinerja Utama</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                \${renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    \`;
    
    container.innerHTML = formSection + tableSection;
    
    // Bind events
    bindRenderedEvents();
    
    // Save state after render
    setTimeout(() => {
      stateManager.saveState(state);
    }, 100);
    
    console.log('[ENHANCED] Content rendered with consistency preservation');
  }

  // Include all other functions from original module...
  // (renderInput, renderSelect, renderTableRows, etc.)
  
  function handleLoadError(error) {
    console.error('[ENHANCED] Handling load error:', error);
    
    const container = findContainer() || document.getElementById('rencana-strategis');
    if (container) {
      container.innerHTML = \`
        <div class="alert alert-danger" role="alert">
          <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Rencana Strategis</h4>
          <p>Terjadi kesalahan saat memuat halaman. Silakan refresh halaman atau hubungi administrator.</p>
          <p class="text-muted">Error: \${error.message}</p>
          <div class="mt-3">
            <button onclick="location.reload()" class="btn btn-primary me-2">
              <i class="fas fa-sync"></i> Refresh Halaman
            </button>
            <button onclick="window.RencanaStrategisModuleEnhanced.load()" class="btn btn-secondary">
              <i class="fas fa-retry"></i> Coba Lagi
            </button>
          </div>
        </div>
      \`;
    }
  }

  // Placeholder functions - include all from original module
  function fetchInitialData() { /* Original implementation */ }
  function generateKode() { /* Original implementation */ }
  function renderInput() { /* Original implementation */ }
  function renderSelect() { /* Original implementation */ }
  function renderTextarea() { /* Original implementation */ }
  function renderStatusSelect() { /* Original implementation */ }
  function renderChipList() { /* Original implementation */ }
  function renderTableRows() { /* Original implementation */ }
  function bindRenderedEvents() { /* Original implementation */ }

  return {
    load,
    state,
    stateManager
  };
})();

// Export enhanced module
window.RencanaStrategisModuleEnhanced = RencanaStrategisModuleEnhanced;
`;

    // 3. Write the enhanced state manager
    fs.writeFileSync(
      path.join(__dirname, 'public/js/rencana-strategis-state-manager.js'),
      routerStateManagerCode
    );
    
    console.log('✅ Created enhanced state manager');

    // 4. Create a patch for the existing rencana-strategis.js
    const patchCode = `
// PATCH: Add refresh consistency to existing Rencana Strategis module
(function() {
  console.log('🔧 Applying Rencana Strategis refresh consistency patch...');
  
  // Initialize state manager
  if (!window.RencanaStrategisStateManager) {
    ${routerStateManagerCode}
  }
  
  const stateManager = new window.RencanaStrategisStateManager();
  
  // Patch the existing module if it exists
  if (window.RencanaStrategisModule) {
    const originalLoad = window.RencanaStrategisModule.load;
    
    window.RencanaStrategisModule.load = async function() {
      console.log('🔧 Enhanced load with refresh consistency...');
      
      // Check for page refresh
      const isPageRefresh = window.performance && 
          window.performance.navigation && 
          window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD;
      
      if (isPageRefresh) {
        console.log('🔄 Page refresh detected, restoring state...');
        const restoredState = stateManager.restoreState();
        
        if (restoredState && this.state) {
          Object.assign(this.state, restoredState);
          console.log('✅ State restored from refresh');
        }
      }
      
      // Call original load
      const result = await originalLoad.call(this);
      
      // Start monitoring after load
      stateManager.startMonitoring();
      
      // Save initial state
      if (this.state) {
        stateManager.saveState(this.state);
      }
      
      return result;
    };
    
    // Patch render function if it exists
    if (window.RencanaStrategisModule.render) {
      const originalRender = window.RencanaStrategisModule.render;
      
      window.RencanaStrategisModule.render = function() {
        console.log('🔧 Enhanced render with consistency check...');
        
        // Store current display model
        const currentDisplayModel = stateManager.getCurrentDisplayModel();
        
        // Call original render
        const result = originalRender.call(this);
        
        // Apply consistency check after render
        setTimeout(() => {
          stateManager.applyDisplayModel(currentDisplayModel);
          if (this.state) {
            stateManager.saveState(this.state);
          }
        }, 50);
        
        return result;
      };
    }
    
    console.log('✅ Rencana Strategis module patched for refresh consistency');
  }
  
  // Also patch the global load function
  if (window.loadRencanaStrategis) {
    const originalLoadRencanaStrategis = window.loadRencanaStrategis;
    
    window.loadRencanaStrategis = async function() {
      console.log('🔧 Enhanced loadRencanaStrategis with refresh consistency...');
      
      // Check for page refresh and restore state
      const isPageRefresh = window.performance && 
          window.performance.navigation && 
          window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD;
      
      if (isPageRefresh) {
        console.log('🔄 Global load: Page refresh detected');
        const restoredState = stateManager.restoreState();
        
        if (restoredState) {
          console.log('✅ Global load: State will be restored');
          // Store for module to pick up
          window._rencanaStrategisRestoredState = restoredState;
        }
      }
      
      // Call original function
      return await originalLoadRencanaStrategis.call(this);
    };
  }
  
})();
`;

    // 5. Write the patch file
    fs.writeFileSync(
      path.join(__dirname, 'public/js/rencana-strategis-refresh-patch.js'),
      patchCode
    );
    
    console.log('✅ Created refresh consistency patch');

    // 6. Create updated HTML template with consistency features
    const htmlTemplate = `
<!-- Enhanced Rencana Strategis Page with Refresh Consistency -->
<div id="rencana-strategis" class="page-content">
  <div class="page-header">
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <h1 class="page-title">
          <i class="fas fa-chart-line text-primary"></i>
          Rencana Strategis
        </h1>
        <p class="page-description">Perencanaan Strategis Organisasi</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline-secondary btn-sm" onclick="location.reload()" title="Refresh Halaman">
          <i class="fas fa-sync"></i> Refresh
        </button>
      </div>
    </div>
  </div>
  
  <!-- Content will be dynamically loaded here -->
  <div id="rencana-strategis-content" class="container-fluid">
    <!-- Loading state -->
    <div class="loading-state" id="rencana-strategis-loading">
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Memuat Rencana Strategis...</p>
      </div>
    </div>
  </div>
</div>

<!-- Include the refresh consistency patch -->
<script src="/js/rencana-strategis-state-manager.js"></script>
<script src="/js/rencana-strategis-refresh-patch.js"></script>

<style>
/* Enhanced styles for consistency */
#rencana-strategis {
  min-height: 100vh;
}

#rencana-strategis-content {
  opacity: 1;
  transition: opacity 0.3s ease;
}

#rencana-strategis-content.loading {
  opacity: 0.7;
}

.loading-state {
  display: none;
}

.loading-state.active {
  display: block;
}

/* Ensure form and table sections maintain their state */
#form-section, #table-section {
  transition: all 0.3s ease;
}

/* Prevent layout shift during refresh */
.page-content {
  min-height: 600px;
}
</style>
`;

    // 7. Write the enhanced HTML template
    fs.writeFileSync(
      path.join(__dirname, 'public/rencana-strategis-enhanced.html'),
      htmlTemplate
    );
    
    console.log('✅ Created enhanced HTML template');

    // 8. Create integration script
    const integrationScript = `
/**
 * Integration script to apply refresh consistency fixes
 * Add this to your main HTML file or app initialization
 */

// 1. Load the state manager and patch
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Loading Rencana Strategis refresh consistency fixes...');
  
  // Load state manager
  const stateManagerScript = document.createElement('script');
  stateManagerScript.src = '/js/rencana-strategis-state-manager.js';
  stateManagerScript.onload = function() {
    console.log('✅ State manager loaded');
    
    // Load patch
    const patchScript = document.createElement('script');
    patchScript.src = '/js/rencana-strategis-refresh-patch.js';
    patchScript.onload = function() {
      console.log('✅ Refresh patch applied');
    };
    document.head.appendChild(patchScript);
  };
  document.head.appendChild(stateManagerScript);
});

// 2. Add page visibility change handler for consistency
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    // Page became visible, check rencana strategis consistency
    const rencanaPage = document.getElementById('rencana-strategis');
    if (rencanaPage && rencanaPage.classList.contains('active')) {
      console.log('🔄 Page visible, checking rencana strategis consistency...');
      
      // Check if state manager exists and apply consistency
      if (window.RencanaStrategisStateManager) {
        const stateManager = new window.RencanaStrategisStateManager();
        const restoredState = stateManager.restoreState();
        
        if (restoredState && restoredState.displayModel) {
          setTimeout(() => {
            stateManager.applyDisplayModel(restoredState.displayModel);
          }, 100);
        }
      }
    }
  }
});

// 3. Add router integration
if (window.appRouter) {
  // Enhance router to preserve rencana strategis state
  const originalNavigate = window.appRouter.navigate;
  
  window.appRouter.navigate = function(path, replace) {
    // Save rencana strategis state before navigation
    if (window.RencanaStrategisStateManager && window.RencanaStrategisModule?.state) {
      const stateManager = new window.RencanaStrategisStateManager();
      stateManager.saveState(window.RencanaStrategisModule.state);
    }
    
    return originalNavigate.call(this, path, replace);
  };
}
`;

    fs.writeFileSync(
      path.join(__dirname, 'public/js/rencana-strategis-integration.js'),
      integrationScript
    );
    
    console.log('✅ Created integration script');

    console.log('\n=== RENCANA STRATEGIS REFRESH CONSISTENCY FIX COMPLETE ===');
    console.log('');
    console.log('FILES CREATED:');
    console.log('1. public/js/rencana-strategis-state-manager.js - Enhanced state management');
    console.log('2. public/js/rencana-strategis-refresh-patch.js - Patch for existing module');
    console.log('3. public/rencana-strategis-enhanced.html - Enhanced HTML template');
    console.log('4. public/js/rencana-strategis-integration.js - Integration script');
    console.log('');
    console.log('INTEGRATION STEPS:');
    console.log('1. Include the integration script in your main HTML file');
    console.log('2. The patch will automatically apply to existing modules');
    console.log('3. State will be preserved across page refreshes');
    console.log('4. Display model consistency will be maintained');
    console.log('');
    console.log('FEATURES ADDED:');
    console.log('✅ State preservation across page refreshes');
    console.log('✅ Display model consistency checks');
    console.log('✅ Enhanced error handling and recovery');
    console.log('✅ Automatic state monitoring and saving');
    console.log('✅ Router integration for seamless navigation');
    
    return {
      success: true,
      filesCreated: [
        'public/js/rencana-strategis-state-manager.js',
        'public/js/rencana-strategis-refresh-patch.js',
        'public/rencana-strategis-enhanced.html',
        'public/js/rencana-strategis-integration.js'
      ]
    };
    
  } catch (error) {
    console.error('❌ Error creating refresh consistency fix:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the fix
if (require.main === module) {
  const result = fixRencanaStrategisRefreshConsistency();
  console.log('\nResult:', result);
  process.exit(result.success ? 0 : 1);
}

module.exports = { fixRencanaStrategisRefreshConsistency };