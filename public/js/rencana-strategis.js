// Rencana Strategis Module (Advanced)
const RencanaStrategisModule = (() => {
  const state = {
    data: [],
    missions: [],
    currentId: null,
    formValues: getDefaultForm(),
    sasaranList: [],
    indikatorList: []
  };

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
    console.log('[AUTH] Rencana Strategis Module load start');
    
    // CRITICAL: Wait for auth to be ready before making API calls
    if (window.waitForAuthReady) {
      const authReady = await window.waitForAuthReady(5000);
      if (!authReady) {
        // Check if user is actually authenticated (might be a timing issue)
        if (window.isAuthenticated && window.currentSession && window.currentSession.access_token) {
          console.log('[AUTH] Rencana Strategis: Auth not ready but session exists, retrying waitForReady...');
          // Retry with longer timeout
          const retryReady = await window.waitForAuthReady(3000);
          if (retryReady) {
            console.log('[AUTH] Rencana Strategis: Auth ready after retry, proceeding with load');
          } else {
            console.log('[AUTH] Rencana Strategis: Auth still not ready after retry, but session exists - proceeding anyway');
            // Session exists, proceed anyway
          }
        } else {
          console.warn('[AUTH] Rencana Strategis: Auth not ready, aborting load');
          return;
        }
      } else {
        console.log('[AUTH] Rencana Strategis: Auth ready, proceeding with load');
      }
    }
    
    // CRITICAL: Check if page is active before loading
    const rencanaPage = document.getElementById('rencana-strategis');
    if (!rencanaPage) {
      console.warn('[AUTH] Rencana strategis page element not found, aborting load');
      return;
    }
    
    const isPageActive = rencanaPage.classList.contains('active');
    if (!isPageActive) {
      console.warn('[AUTH] Rencana strategis page not active, aborting load');
      return;
    }
    
    // CRITICAL: Verify container exists or can be created
    let container = findContainer();
    if (!container) {
      console.warn('[AUTH] Container not found, will retry during render');
      // Don't abort - render() will handle container creation
    } else {
      console.log('[AUTH] Container verified before load');
    }
    
    try {
      // ✅ Wait for Supabase client to be ready
      if (window.SupabaseClientManager) {
        try {
          console.log('📋 Rencana Strategis: Waiting for Supabase client...');
          await window.SupabaseClientManager.waitForClient(10000);
          console.log('📋 Rencana Strategis: Supabase client ready');
        } catch (error) {
          console.warn('📋 Rencana Strategis: Supabase client not ready:', error);
          // Continue with fallback - use local generation
        }
      }
      
      console.log('Fetching initial data...');
      await fetchInitialData();
      
      console.log('Checking if need to generate kode...');
      if (!state.currentId) {
        console.log('Generating kode...');
        await generateKode();
      }
      
      console.log('Rendering form...');
      render();
      
      console.log('=== RENCANA STRATEGIS MODULE LOAD COMPLETE ===');
    } catch (error) {
      console.error('=== RENCANA STRATEGIS MODULE LOAD ERROR ===', error);
      
      // Even on error, try to render with fallback data
      try {
        if (!state.formValues.kode && !state.currentId) {
          const year = new Date().getFullYear();
          const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
          state.formValues.kode = `RS-${year}-${random}`;
          console.log('Error recovery: Generated fallback kode:', state.formValues.kode);
        }
        render();
      } catch (renderError) {
        console.error('Failed to render after error:', renderError);
        
        // Last resort: show error message
        const errorContainer = findContainer() || document.getElementById('rencana-strategis');
        if (errorContainer) {
          errorContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
              <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Rencana Strategis</h4>
              <p>Terjadi kesalahan saat memuat halaman. Silakan refresh halaman atau hubungi administrator.</p>
              <p class="text-muted">Error: ${renderError.message}</p>
              <button onclick="location.reload()" class="btn btn-primary">
                <i class="fas fa-sync"></i> Refresh Halaman
              </button>
            </div>
          `;
        }
      }
    }
  }

  async function fetchInitialData() {
    try {
      console.log('Fetching rencana strategis initial data...');
      
      // Try multiple endpoints in order of preference
      let rencana, visiMisi;
      
      const rencanaEndpoints = [
        '/api/rencana-strategis/public',
        '/api/rencana-strategis',
        '/api/simple/rencana-strategis', 
        '/api/debug-data/rencana-strategis',
        '/api/test-data/rencana-strategis'
      ];
      
      const visiMisiEndpoints = [
        '/api/visi-misi/public',
        '/api/visi-misi',
        '/api/simple/visi-misi', 
        '/api/debug-data/visi-misi',
        '/api/test-data/visi-misi'
      ];
      
      // Fetch rencana strategis
      for (const endpoint of rencanaEndpoints) {
        try {
          console.log(`Trying rencana strategis endpoint: ${endpoint}`);
          const response = await api()(endpoint);
          console.log(`Rencana strategis response from ${endpoint}:`, response);
          
          // Handle different response formats
          if (response && response.success && response.data) {
            rencana = response.data;
          } else if (Array.isArray(response)) {
            rencana = response;
          } else if (response && typeof response === 'object') {
            rencana = response;
          }
          
          console.log(`Rencana strategis processed from ${endpoint}:`, rencana?.length || 0);
          break;
        } catch (error) {
          console.warn(`Rencana strategis endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }
      
      // Fetch visi misi
      for (const endpoint of visiMisiEndpoints) {
        try {
          console.log(`Trying visi misi endpoint: ${endpoint}`);
          const response = await api()(endpoint);
          console.log(`Visi misi response from ${endpoint}:`, response);
          
          // Handle different response formats
          if (response && response.success && response.data) {
            visiMisi = response.data;
          } else if (Array.isArray(response)) {
            visiMisi = response;
          } else if (response && typeof response === 'object') {
            visiMisi = response;
          }
          
          console.log(`Visi misi processed from ${endpoint}:`, visiMisi?.length || 0);
          break;
        } catch (error) {
          console.warn(`Visi misi endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }
      
      state.data = Array.isArray(rencana) ? rencana : [];
      state.missions = Array.isArray(visiMisi) ? visiMisi : [];
      
      console.log('Fetched data:', {
        rencanaCount: state.data.length,
        visiMisiCount: state.missions.length
      });
    } catch (error) {
      console.error('Error in fetchInitialData:', error);
      state.data = [];
      state.missions = [];
    }
  }

  async function generateKode(force = false) {
    if (state.currentId && !force) return;
    
    try {
      console.log('Generating kode via API...');
      
      // Try public endpoint first, then authenticated endpoint
      const endpoints = [
        '/api/rencana-strategis/generate/kode/public',
        '/api/rencana-strategis/generate/kode'
      ];
      
      let kode = null;
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying kode generation endpoint: ${endpoint}`);
          const response = await api()(endpoint);
          kode = response.kode;
          console.log(`Generated kode from ${endpoint}:`, kode);
          break;
        } catch (endpointError) {
          console.warn(`Kode generation endpoint ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }
      
      if (kode) {
        state.formValues.kode = kode;
      } else {
        throw new Error('All kode generation endpoints failed');
      }
    } catch (error) {
      console.warn('Failed to generate kode via API, using fallback:', error.message);
      // Fallback: generate kode locally
      const year = new Date().getFullYear();
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const fallbackKode = `RS-${year}-${random}`;
      state.formValues.kode = fallbackKode;
      console.log('Generated fallback kode:', fallbackKode);
    }
  }

  function render() {
    console.log('🎨 Starting render process...');
    
    // Enhanced container finding with multiple strategies
    let container = findContainer();
    
    if (!container) {
      console.error('❌ Container not found immediately, implementing retry strategy...');
      
      // Retry strategy with exponential backoff
      let retryCount = 0;
      const maxRetries = 10;
      
      const retryRender = () => {
        retryCount++;
        console.log(`🔄 Retry ${retryCount}/${maxRetries}: Looking for container...`);
        
        container = findContainer();
        
        if (container) {
          console.log(`✅ Container found on retry ${retryCount}, rendering...`);
          renderContent(container);
        } else if (retryCount < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          const delay = Math.min(100 * Math.pow(2, retryCount - 1), 2000);
          setTimeout(retryRender, delay);
        } else {
          console.error('❌ Container not found after all retries, creating fallback...');
          createFallbackContainer();
        }
      };
      
      // Start retry after short delay
      setTimeout(retryRender, 100);
      return;
    }
    
    console.log('✅ Container found immediately, rendering...');
    renderContent(container);
  }

  function findContainer() {
    // Strategy 1: Try exact ID match
    let container = getEl('rencana-strategis-content');
    if (container) {
      console.log('✅ Found container with exact ID: rencana-strategis-content');
      return container;
    }
    
    // Strategy 2: Try alternative IDs
    const alternatives = [
      'rencana-strategis-content',
      'rencana-strategis',
      'content-area',
      'main-content'
    ];
    
    for (const altId of alternatives) {
      container = document.getElementById(altId);
      if (container) {
        console.log(`✅ Found alternative container: ${altId}`);
        return container;
      }
    }
    
    // Strategy 3: Try CSS selectors
    const selectors = [
      '#rencana-strategis .page-content',
      '.page-content.active',
      '.page-content[id*="rencana"]',
      '#rencana-strategis'
    ];
    
    for (const selector of selectors) {
      try {
        container = document.querySelector(selector);
        if (container) {
          console.log(`✅ Found container with selector: ${selector}`);
          return container;
        }
      } catch (error) {
        console.warn(`⚠️ Invalid selector: ${selector}`);
      }
    }
    
    // Strategy 4: Look for any element with rencana-strategis in class or id
    const allElements = document.querySelectorAll('[id*="rencana"], [class*="rencana"]');
    console.log('🔍 Available rencana elements:', Array.from(allElements).map(el => ({
      id: el.id,
      className: el.className,
      tagName: el.tagName
    })));
    
    // Try to find the most suitable container
    for (const element of allElements) {
      if (element.id === 'rencana-strategis' || 
          element.classList.contains('page-content')) {
        console.log(`✅ Found suitable container: ${element.id || element.className}`);
        return element;
      }
    }
    
    return null;
  }

  function createFallbackContainer() {
    console.log('🆘 Creating fallback container...');
    
    // Try to find the rencana-strategis page
    const rencanaPage = document.getElementById('rencana-strategis');
    if (rencanaPage) {
      // Create the missing content container
      let contentContainer = rencanaPage.querySelector('#rencana-strategis-content');
      if (!contentContainer) {
        contentContainer = document.createElement('div');
        contentContainer.id = 'rencana-strategis-content';
        contentContainer.className = 'container-fluid';
        
        // Find where to insert it (after page-header if exists)
        const pageHeader = rencanaPage.querySelector('.page-header');
        if (pageHeader) {
          pageHeader.insertAdjacentElement('afterend', contentContainer);
        } else {
          rencanaPage.appendChild(contentContainer);
        }
        
        console.log('✅ Fallback container created successfully');
        renderContent(contentContainer);
      }
    } else {
      console.error('❌ Cannot create fallback - rencana-strategis page not found');
      
      // Last resort: show error in any available container
      const anyContainer = document.querySelector('.content-area, .main-content, main');
      if (anyContainer) {
        anyContainer.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Rencana Strategis</h4>
            <p>Container tidak ditemukan. Silakan refresh halaman atau hubungi administrator.</p>
            <button onclick="location.reload()" class="btn btn-primary">
              <i class="fas fa-sync"></i> Refresh Halaman
            </button>
          </div>
        `;
      }
    }
  }

  function renderContent(container) {
    console.log('Rendering rencana strategis form...');
    console.log('Container found:', container);
    console.log('Container innerHTML length:', container.innerHTML.length);
    console.log('State:', {
      currentId: state.currentId,
      formValues: state.formValues,
      sasaranList: state.sasaranList,
      indikatorList: state.indikatorList,
      dataCount: state.data.length,
      missionsCount: state.missions.length
    });
    
    // Render form section (always visible)
    const formSection = `
      <div class="card mb-4" id="form-section">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h3 class="card-title">${state.currentId ? 'Edit Rencana Strategis' : 'Tambah Rencana Strategis'}</h3>
              <p class="text-muted mb-0">Hubungkan sasaran strategis dengan indikator kinerja utama</p>
            </div>
            <div>
              <span class="badge ${state.currentId ? 'badge-warning' : 'badge-primary'} mr-2">
                ${state.currentId ? 'Mode Edit' : 'Mode Input'}
              </span>
              ${state.currentId ? `
                <button type="button" class="btn btn-sm btn-secondary" id="rs-cancel-edit">
                  <i class="fas fa-times"></i> Batal Edit
                </button>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="card-body">
          <form id="rs-form" class="form-grid two-column">
            ${renderInput('Kode Rencana', 'rs-kode', 'text', state.formValues.kode, true)}
            ${renderSelect('Misi Strategis', 'rs-misi', state.missions, state.formValues.visi_misi_id)}
            ${renderInput('Nama Rencana Strategis', 'rs-nama', 'text', state.formValues.nama_rencana)}
            ${renderInput('Periode Mulai', 'rs-mulai', 'date', state.formValues.periode_mulai)}
            ${renderInput('Periode Selesai', 'rs-selesai', 'date', state.formValues.periode_selesai)}
            ${renderTextarea('Deskripsi Rencana', 'rs-deskripsi', state.formValues.deskripsi)}
            ${renderTextarea('Target', 'rs-target', state.formValues.target)}
            ${renderStatusSelect('Status', 'rs-status', state.formValues.status || 'Draft')}
            <div class="form-group full-width">
              <label>Indikator Kinerja</label>
              <input type="text" id="rs-indikator" value="${state.formValues.indikator_kinerja || ''}">
            </div>
            <div class="form-group full-width">
              <label>Tambah Sasaran Strategis</label>
              <div class="input-with-button">
                <input type="text" id="rs-sasaran-input" placeholder="Masukkan sasaran">
                <button type="button" class="btn btn-primary btn-sm" id="rs-sasaran-add"><i class="fas fa-plus"></i></button>
              </div>
              <div class="chip-group" id="rs-sasaran-list">${renderChipList(state.sasaranList, 'sasaran')}</div>
            </div>
            <div class="form-group full-width">
              <label>Tambah Indikator Kinerja Utama</label>
              <div class="input-with-button">
                <input type="text" id="rs-indikator-input" placeholder="Masukkan indikator">
                <button type="button" class="btn btn-primary btn-sm" id="rs-indikator-add"><i class="fas fa-plus"></i></button>
              </div>
              <div class="chip-group" id="rs-indikator-list">${renderChipList(state.indikatorList, 'indikator')}</div>
            </div>
            <div class="form-actions full-width">
              <button type="submit" class="btn btn-primary">${state.currentId ? 'Update' : 'Simpan'} Rencana</button>
              <button type="button" id="rs-reset-btn" class="btn btn-secondary">Reset</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Render table section (hidden when editing)
    const tableSection = `
      <div class="card" id="table-section" ${state.currentId ? 'style="display: none;"' : ''}>
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
                ${renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = formSection + tableSection;

    console.log('Form HTML rendered, binding events...');
    console.log('Container innerHTML after render:', container.innerHTML.length, 'characters');
    console.log('Form element found:', !!container.querySelector('#rs-form'));
    console.log('Input elements found:', container.querySelectorAll('input').length);
    console.log('Button elements found:', container.querySelectorAll('button').length);
    
    bindRenderedEvents();
    console.log('Events bound successfully');
  }

  function renderInput(label, id, type, value = '', readonly = false) {
    return `
      <div class="form-group">
        <label>${label}</label>
        <input type="${type}" class="form-control" id="${id}" value="${value || ''}" ${readonly ? 'readonly' : ''}>
      </div>
    `;
  }

  function renderTextarea(label, id, value = '') {
    return `
      <div class="form-group full-width">
        <label>${label}</label>
        <textarea id="${id}" class="form-control" rows="2">${value || ''}</textarea>
      </div>
    `;
  }

  function renderSelect(label, id, options = [], selected = '') {
    const opts = ['<option value="">Pilih salah satu</option>'];
    
    // For each visi_misi, split misi into separate options
    options.forEach((opt) => {
      if (opt.misi) {
        // Split misi by newline to get individual misi items
        const misiArray = opt.misi.split('\n').filter(m => m.trim());
        misiArray.forEach((misi, index) => {
          // Clean up misi text (remove numbering if exists)
          let cleanMisi = misi.trim();
          // Remove leading numbers like "1.", "2.", etc.
          cleanMisi = cleanMisi.replace(/^\d+\.\s*/, '');
          
          // Create unique value: visi_misi_id|misi_index|misi_text
          const value = `${opt.id}|${index}|${encodeURIComponent(cleanMisi)}`;
          
          // Check if this option is selected
          let isSelected = false;
          if (selected) {
            if (selected.includes('|')) {
              const [selId, selIndex] = selected.split('|');
              isSelected = (selId === opt.id && parseInt(selIndex) === index);
            } else {
              isSelected = (opt.id === selected && index === 0);
            }
          }
          
          opts.push(`<option value="${value}" ${isSelected ? 'selected' : ''}>${cleanMisi}</option>`);
        });
      }
    });
    
    return `
      <div class="form-group">
        <label>${label}</label>
        <select id="${id}" class="form-control">
          ${opts.join('')}
        </select>
      </div>
    `;
  }

  function renderStatusSelect(label, id, selected = 'Draft') {
    const statusOptions = [
      { value: 'Draft', label: 'Draft', color: 'warning' },
      { value: 'Final', label: 'Final', color: 'success' }
    ];
    
    const opts = statusOptions.map(option => 
      `<option value="${option.value}" ${selected === option.value ? 'selected' : ''}>${option.label}</option>`
    ).join('');
    
    return `
      <div class="form-group">
        <label>${label}</label>
        <select id="${id}" class="form-control">
          ${opts}
        </select>
      </div>
    `;
  }

  function renderChipList(list = [], type) {
    if (!list.length) {
      return '<p class="text-muted">Belum ada data</p>';
    }
    return list
      .map(
        (item, index) => `
      <span class="chip chip-removable" data-type="${type}" data-index="${index}">
        ${item}
        <button type="button" class="chip-remove" data-type="${type}" data-index="${index}">
          <i class="fas fa-times"></i>
        </button>
      </span>`
      )
      .join('');
  }

  function renderTableRows() {
    console.log('Rendering table rows with data:', state.data.length, 'items');
    
    if (!state.data.length) {
      return '<tr><td colspan="8" class="table-empty"><i class="fas fa-inbox"></i><br>Belum ada rencana strategis</td></tr>';
    }
    
    return state.data
      .map((item, index) => {
        console.log(`Rendering row ${index + 1}:`, item.kode, item.nama_rencana);
        
        const sasaran = safeArray(item.sasaran_strategis);
        const indikator = safeArray(item.indikator_kinerja_utama);
        
        // Format sasaran strategis untuk tampilan dengan tooltip
        const sasaranDisplay = sasaran.length > 0 
          ? (sasaran.length > 2 
              ? sasaran.slice(0, 2).join('; ') + ` ... (+${sasaran.length - 2} lainnya)`
              : sasaran.join('; '))
          : '-';
        
        const sasaranTooltip = sasaran.length > 2 ? sasaran.join('; ') : '';
        
        // Format indikator kinerja utama untuk tampilan dengan tooltip
        const indikatorDisplay = indikator.length > 0 
          ? (indikator.length > 2 
              ? indikator.slice(0, 2).join('; ') + ` ... (+${indikator.length - 2} lainnya)`
              : indikator.join('; '))
          : '-';
        
        const indikatorTooltip = indikator.length > 2 ? indikator.join('; ') : '';
        
        // Format periode
        const periodeDisplay = item.periode_mulai && item.periode_selesai 
          ? `${formatDate(item.periode_mulai)} s/d ${formatDate(item.periode_selesai)}`
          : '-';
        
        // Format target dengan tooltip untuk teks panjang
        const targetDisplay = item.target 
          ? (item.target.length > 120 ? item.target.substring(0, 120) + '...' : item.target)
          : '-';
        
        const targetTooltip = item.target && item.target.length > 120 ? item.target : '';
        
        // Format deskripsi dengan tooltip untuk teks panjang
        const deskripsiDisplay = item.deskripsi 
          ? (item.deskripsi.length > 150 ? item.deskripsi.substring(0, 150) + '...' : item.deskripsi)
          : '-';
        
        const deskripsiTooltip = item.deskripsi && item.deskripsi.length > 150 ? item.deskripsi : '';
        
        // Format nama rencana dengan tooltip jika terlalu panjang
        const namaDisplay = item.nama_rencana || '-';
        const namaTooltip = item.nama_rencana && item.nama_rencana.length > 50 ? item.nama_rencana : '';
        
        return `
        <tr data-id="${item.id}">
          <td><strong>${item.kode}</strong></td>
          <td>
            <div class="table-cell-content">
              <strong ${namaTooltip ? `title="${escapeHtml(namaTooltip)}"` : ''}>${namaDisplay}</strong>
              <small class="text-muted d-block" ${deskripsiTooltip ? `title="${escapeHtml(deskripsiTooltip)}"` : ''}>${deskripsiDisplay}</small>
            </div>
          </td>
          <td>
            <div class="table-cell-content" ${targetTooltip ? `title="${escapeHtml(targetTooltip)}"` : ''}>
              <span class="text-primary">${targetDisplay}</span>
            </div>
          </td>
          <td><span class="text-muted">${periodeDisplay}</span></td>
          <td>
            <div class="table-cell-content" ${sasaranTooltip ? `title="${escapeHtml(sasaranTooltip)}"` : ''}>
              <small class="text-info">${sasaranDisplay}</small>
            </div>
          </td>
          <td>
            <div class="table-cell-content" ${indikatorTooltip ? `title="${escapeHtml(indikatorTooltip)}"` : ''}>
              <small class="text-success">${indikatorDisplay}</small>
            </div>
          </td>
          <td>
            <span class="badge badge-status badge-${getStatusBadgeClass(item.status)}" title="${item.status || 'Draft'}">
              ${item.status || 'Draft'}
            </span>
          </td>
          <td class="table-actions">
            <button class="btn btn-info btn-sm rs-view-btn" data-id="${item.id}" title="Lihat Detail">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-edit btn-sm rs-edit-btn" data-id="${item.id}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-delete btn-sm rs-delete-btn" data-id="${item.id}" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
      })
      .join('');
  }

  // Helper function to format dates
  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  // Helper function to escape HTML for tooltips
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper function to get status badge class
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Final':
        return 'final';
      case 'Draft':
      default:
        return 'draft';
    }
  }

  function safeArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  function bindRenderedEvents() {
    getEl('rs-form')?.addEventListener('submit', handleSubmit);
    getEl('rs-reset-btn')?.addEventListener('click', resetForm);
    getEl('rs-cancel-edit')?.addEventListener('click', cancelEdit);
    getEl('rs-sasaran-add')?.addEventListener('click', () => addListItem('sasaran'));
    getEl('rs-indikator-add')?.addEventListener('click', () => addListItem('indikator'));
    document.querySelectorAll('.chip-remove').forEach((btn) =>
      btn.addEventListener('click', () => removeListItem(btn.dataset.type, Number(btn.dataset.index)))
    );
    document.querySelectorAll('.rs-view-btn').forEach((btn) => btn.addEventListener('click', () => viewDetail(btn.dataset.id)));
    document.querySelectorAll('.rs-edit-btn').forEach((btn) => btn.addEventListener('click', () => startEdit(btn.dataset.id)));
    document.querySelectorAll('.rs-delete-btn').forEach((btn) =>
      btn.addEventListener('click', () => deleteRencana(btn.dataset.id))
    );
    getEl('rs-download-template')?.addEventListener('click', () => downloadFile('/api/rencana-strategis/actions/template', 'template-rencana-strategis.xlsx'));
    getEl('rs-export-btn')?.addEventListener('click', () => downloadFile('/api/rencana-strategis/actions/export', 'rencana-strategis.xlsx'));
    getEl('rs-import-btn')?.addEventListener('click', () => getEl('rs-import-input')?.click());
    getEl('rs-import-input')?.addEventListener('change', handleImport);
  }

  function captureFormValues() {
    const getValue = (id) => getEl(id)?.value || '';
    state.formValues = {
      kode: getValue('rs-kode'),
      visi_misi_id: getValue('rs-misi'),
      nama_rencana: getValue('rs-nama'),
      deskripsi: getValue('rs-deskripsi'),
      periode_mulai: getValue('rs-mulai'),
      periode_selesai: getValue('rs-selesai'),
      target: getValue('rs-target'),
      indikator_kinerja: getValue('rs-indikator'),
      status: getValue('rs-status') || 'Draft'
    };
  }

  function addListItem(type) {
    captureFormValues();
    const inputId = type === 'sasaran' ? 'rs-sasaran-input' : 'rs-indikator-input';
    const value = getEl(inputId)?.value.trim();
    if (!value) return;
    if (type === 'sasaran') {
      state.sasaranList.push(value);
    } else {
      state.indikatorList.push(value);
    }
    render();
  }

  function removeListItem(type, index) {
    captureFormValues();
    if (type === 'sasaran') {
      state.sasaranList.splice(index, 1);
    } else {
      state.indikatorList.splice(index, 1);
    }
    render();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    captureFormValues();
    
    // Extract visi_misi_id and misi text from format "visi_misi_id|misi_index|misi_text"
    let visiMisiId = state.formValues.visi_misi_id;
    let selectedMisiText = '';
    
    if (visiMisiId && visiMisiId.includes('|')) {
      const parts = visiMisiId.split('|');
      visiMisiId = parts[0];
      
      // Get the misi text from the encoded value
      if (parts.length >= 3) {
        selectedMisiText = decodeURIComponent(parts[2]);
      } else {
        // Fallback: get from visi_misi data
        const visiMisi = state.missions.find(m => m.id === visiMisiId);
        if (visiMisi && visiMisi.misi) {
          const misiArray = visiMisi.misi.split('\n').filter(m => m.trim());
          const index = parseInt(parts[1]) || 0;
          let misiText = misiArray[index] || '';
          // Remove numbering
          selectedMisiText = misiText.replace(/^\d+\.\s*/, '').trim();
        }
      }
    }
    
    const payload = {
      visi_misi_id: visiMisiId || null,
      nama_rencana: state.formValues.nama_rencana || selectedMisiText,
      deskripsi: state.formValues.deskripsi,
      periode_mulai: state.formValues.periode_mulai || null,
      periode_selesai: state.formValues.periode_selesai || null,
      target: state.formValues.target,
      indikator_kinerja: state.formValues.indikator_kinerja,
      status: state.formValues.status || 'Draft',
      sasaran_strategis: state.sasaranList,
      indikator_kinerja_utama: state.indikatorList
    };

    // Only include kode for new records (not updates)
    if (!state.currentId) {
      payload.kode = state.formValues.kode;
    }

    if (!payload.nama_rencana) {
      alert('Nama rencana wajib diisi atau pilih misi strategis');
      return;
    }

    try {
      if (state.currentId) {
        await api()(`/api/rencana-strategis/${state.currentId}`, { method: 'PUT', body: payload });
        alert('Rencana strategis berhasil diupdate');
      } else {
        await api()('/api/rencana-strategis', { method: 'POST', body: payload });
        alert('Rencana strategis berhasil disimpan');
      }

      await fetchInitialData();
      await resetForm();
    } catch (error) {
      console.error('Error saving rencana strategis:', error);
      alert('Gagal menyimpan rencana strategis: ' + (error.message || 'Unknown error'));
    }
  }

  async function resetForm() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    await generateKode(true);
    toggleTableVisibility(true); // Show table when resetting
    render();
  }

  function cancelEdit() {
    state.currentId = null;
    state.formValues = getDefaultForm();
    state.sasaranList = [];
    state.indikatorList = [];
    toggleTableVisibility(true); // Show table when canceling edit
    render();
  }

  function toggleTableVisibility(show) {
    const tableSection = document.getElementById('table-section');
    if (tableSection) {
      tableSection.style.display = show ? 'block' : 'none';
    }
  }

  function viewDetail(id) {
    const record = state.data.find((item) => item.id === id);
    if (!record) return;
    
    const sasaran = safeArray(record.sasaran_strategis);
    const indikator = safeArray(record.indikator_kinerja_utama);
    
    const modalContent = `
      <div class="modal fade" id="detailModal" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detail Rencana Strategis</h5>
              <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6><strong>Kode:</strong></h6>
                  <p>${record.kode}</p>
                  
                  <h6><strong>Nama Rencana:</strong></h6>
                  <p>${record.nama_rencana}</p>
                  
                  <h6><strong>Status:</strong></h6>
                  <p><span class="badge badge-${record.status === 'Aktif' ? 'success' : 'warning'}">${record.status}</span></p>
                  
                  <h6><strong>Periode:</strong></h6>
                  <p>${record.periode_mulai} s/d ${record.periode_selesai}</p>
                </div>
                <div class="col-md-6">
                  <h6><strong>Target:</strong></h6>
                  <p>${record.target || '-'}</p>
                  
                  <h6><strong>Indikator Kinerja:</strong></h6>
                  <p>${record.indikator_kinerja || '-'}</p>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-12">
                  <h6><strong>Deskripsi:</strong></h6>
                  <p>${record.deskripsi || '-'}</p>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-md-6">
                  <h6><strong>Sasaran Strategis:</strong></h6>
                  <ul>
                    ${sasaran.map(s => `<li>${s}</li>`).join('')}
                  </ul>
                </div>
                <div class="col-md-6">
                  <h6><strong>Indikator Kinerja Utama:</strong></h6>
                  <ul>
                    ${indikator.map(i => `<li>${i}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" onclick="startEdit('${record.id}'); $('#detailModal').modal('hide');">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('detailModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Show modal (using Bootstrap modal if available, otherwise simple display)
    const modal = document.getElementById('detailModal');
    if (window.$ && window.$.fn.modal) {
      $(modal).modal('show');
    } else {
      modal.style.display = 'block';
      modal.classList.add('show');
    }
    
    // Add close event listeners
    modal.querySelectorAll('[data-dismiss="modal"], .close').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.$ && window.$.fn.modal) {
          $(modal).modal('hide');
        } else {
          modal.style.display = 'none';
          modal.classList.remove('show');
        }
      });
    });
  }

  function startEdit(id) {
    const record = state.data.find((item) => item.id === id);
    if (!record) return;
    state.currentId = id;
    
    // Hide table when editing
    toggleTableVisibility(false);
    
    // Find the matching misi option value
    let misiValue = record.visi_misi_id || '';
    if (record.visi_misi_id && record.nama_rencana) {
      const visiMisi = state.missions.find(m => m.id === record.visi_misi_id);
      if (visiMisi && visiMisi.misi) {
        const misiArray = visiMisi.misi.split('\n').filter(m => m.trim());
        // Try to find matching misi by comparing nama_rencana
        const matchIndex = misiArray.findIndex(m => {
          const cleanMisi = m.replace(/^\d+\.\s*/, '').trim();
          return cleanMisi === record.nama_rencana || m.trim() === record.nama_rencana;
        });
        
        if (matchIndex >= 0) {
          const cleanMisi = misiArray[matchIndex].replace(/^\d+\.\s*/, '').trim();
          misiValue = `${record.visi_misi_id}|${matchIndex}|${encodeURIComponent(cleanMisi)}`;
        }
      }
    }
    
    state.formValues = {
      kode: record.kode,
      visi_misi_id: misiValue,
      nama_rencana: record.nama_rencana,
      deskripsi: record.deskripsi || '',
      periode_mulai: record.periode_mulai ? record.periode_mulai.substring(0, 10) : '',
      periode_selesai: record.periode_selesai ? record.periode_selesai.substring(0, 10) : '',
      target: record.target || '',
      indikator_kinerja: record.indikator_kinerja || '',
      status: record.status || 'Draft'
    };
    state.sasaranList = safeArray(record.sasaran_strategis);
    state.indikatorList = safeArray(record.indikator_kinerja_utama);
    render();
    
    // Scroll to form
    document.getElementById('rs-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteRencana(id) {
    if (!confirm('Hapus rencana strategis ini?')) return;
    await api()(`/api/rencana-strategis/${id}`, { method: 'DELETE' });
    alert('Rencana strategis berhasil dihapus');
    await fetchInitialData();
    if (state.currentId === id) {
      resetForm();
    } else {
      render();
    }
  }

  async function downloadFile(endpoint, filename) {
    try {
      let token = null;
      try {
        if (typeof getAuthToken === 'function') {
          token = await getAuthToken();
        }
      } catch (tokenError) {
        console.warn('Failed to get auth token:', tokenError.message);
      }
      
      const response = await fetch(`${window.location.origin}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Gagal mengunduh berkas');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = await readExcel(file);
      await api()('/api/rencana-strategis/actions/import', { method: 'POST', body: { items: data } });
      alert('Import rencana strategis berhasil');
      await fetchInitialData();
      render();
    } catch (error) {
      console.error(error);
      alert('Gagal mengimpor data');
    } finally {
      event.target.value = '';
    }
  }

  function readExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }

  return {
    load
  };
})();

async function loadRencanaStrategis() {
  console.log('[AUTH] Load Rencana Strategis start');
  
  // CRITICAL: Wait for auth to be ready before making API calls
  if (window.waitForAuthReady) {
    const authReady = await window.waitForAuthReady(5000);
    if (!authReady) {
      // Check if user is actually authenticated (might be a timing issue)
      if (window.isAuthenticated && window.currentSession && window.currentSession.access_token) {
        console.log('[AUTH] Rencana Strategis: Auth not ready but session exists, retrying waitForReady...');
        // Retry with longer timeout
        const retryReady = await window.waitForAuthReady(3000);
        if (retryReady) {
          console.log('[AUTH] Rencana Strategis: Auth ready after retry, proceeding with load');
        } else {
          console.log('[AUTH] Rencana Strategis: Auth still not ready after retry, but session exists - proceeding anyway');
          // Session exists, proceed anyway
        }
      } else {
        console.warn('[AUTH] Rencana Strategis: Auth not ready, aborting load');
        return;
      }
    }
  }
  
  // CRITICAL: Pre-flight checks before loading
  const preflightChecks = {
    userAuthenticated: !!(window.currentUser || window.isAuthenticated),
    pageExists: !!document.getElementById('rencana-strategis'),
    pageActive: !!document.querySelector('#rencana-strategis.active'),
    moduleAvailable: !!window.RencanaStrategisModule
  };
  
  console.log('[AUTH] Pre-flight checks:', preflightChecks);
  
  // Check authentication (backup check)
  if (!preflightChecks.userAuthenticated) {
    console.warn('[AUTH] User not authenticated, aborting load');
    return;
  }
  
  // Check if page exists
  if (!preflightChecks.pageExists) {
    console.warn('⚠️ Rencana strategis page not found, aborting load');
    return;
  }
  
  // Check if page is active (most important check)
  if (!preflightChecks.pageActive) {
    console.warn('⚠️ Rencana strategis page not active, aborting load');
    return;
  }
  
  // Check if module is available
  if (!preflightChecks.moduleAvailable) {
    console.error('❌ RencanaStrategisModule not available, aborting load');
    return;
  }
  
  try {
    console.log('✅ All pre-flight checks passed, loading module...');
    await window.RencanaStrategisModule.load();
    console.log('✅ === LOAD RENCANA STRATEGIS COMPLETE ===');
  } catch (error) {
    console.error('❌ === LOAD RENCANA STRATEGIS ERROR ===', error);
    
    // Show user-friendly error message
    const container = document.getElementById('rencana-strategis-content') ||
                     document.getElementById('rencana-strategis');
    
    if (container) {
      container.innerHTML = `
        <div class="alert alert-warning" role="alert">
          <h4><i class="fas fa-exclamation-triangle"></i> Gagal Memuat Rencana Strategis</h4>
          <p>Terjadi kesalahan saat memuat halaman. Silakan coba lagi atau refresh halaman.</p>
          <div class="mt-3">
            <button onclick="loadRencanaStrategis()" class="btn btn-primary me-2">
              <i class="fas fa-retry"></i> Coba Lagi
            </button>
            <button onclick="location.reload()" class="btn btn-secondary">
              <i class="fas fa-sync"></i> Refresh Halaman
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Export module to window
window.RencanaStrategisModule = RencanaStrategisModule;
window.rencanaStrategisModule = RencanaStrategisModule;
window.loadRencanaStrategis = loadRencanaStrategis;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, checking for rencana strategis container...');
  
  const checkAndInit = () => {
    // Enhanced container detection
    const container = document.getElementById('rencana-strategis-content') ||
                     document.getElementById('rencana-strategis') ||
                     document.querySelector('#rencana-strategis .page-content');
    
    console.log('🔍 Container check result:', {
      'rencana-strategis-content': !!document.getElementById('rencana-strategis-content'),
      'rencana-strategis': !!document.getElementById('rencana-strategis'),
      'page active': !!document.querySelector('#rencana-strategis.active'),
      'container found': !!container
    });
    
    // Only auto-initialize if:
    // 1. Container exists
    // 2. Container is empty or has minimal content
    // 3. Rencana strategis page is active
    const rencanaPage = document.getElementById('rencana-strategis');
    const isPageActive = rencanaPage && rencanaPage.classList.contains('active');
    
    if (container && isPageActive) {
      const isEmpty = !container.innerHTML.trim() || 
                     container.innerHTML.trim().length < 100;
      
      if (isEmpty) {
        console.log('✅ Auto-initializing rencana strategis module...');
        // Add small delay to ensure page is fully rendered
        setTimeout(() => {
          const containerCheck = document.getElementById('rencana-strategis-content') ||
                                document.getElementById('rencana-strategis') ||
                                document.querySelector('#rencana-strategis .page-content');
          
          if (containerCheck) {
            console.log('🚀 Container verified, loading rencana strategis...');
            loadRencanaStrategis();
          } else {
            console.warn('⚠️ Container disappeared, skipping auto-init');
          }
        }, 300);
      } else {
        console.log('ℹ️ Container has content, skipping auto-init');
      }
    } else {
      console.log('ℹ️ Container not found or page not active, skipping auto-init');
    }
  };
  
  // Try immediately and with delays to handle different loading scenarios
  checkAndInit();
  setTimeout(checkAndInit, 500);
  setTimeout(checkAndInit, 1500);
});

// Enhanced page visibility change handler
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible, check if we need to initialize
    const rencanaPage = document.getElementById('rencana-strategis');
    if (rencanaPage && rencanaPage.classList.contains('active')) {
      const container = document.getElementById('rencana-strategis-content');
      if (container && (!container.innerHTML.trim() || container.innerHTML.trim().length < 100)) {
        console.log('🔄 Page visible and container empty, initializing...');
        setTimeout(() => loadRencanaStrategis(), 100);
      }
    }
  }
});

// Enhanced navigation event handler
window.addEventListener('popstate', () => {
  // Handle browser back/forward navigation
  setTimeout(() => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('rencana-strategis') || currentPath === '/rencana-strategis') {
      const container = document.getElementById('rencana-strategis-content');
      if (container && (!container.innerHTML.trim() || container.innerHTML.trim().length < 100)) {
        console.log('🧭 Navigation to rencana strategis detected, initializing...');
        loadRencanaStrategis();
      }
    }
  }, 200);
});

// Also make module available immediately when script loads
console.log('Rencana Strategis module loaded and available');

