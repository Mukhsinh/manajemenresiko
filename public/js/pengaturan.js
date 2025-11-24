// Pengaturan Aplikasi Module
const PengaturanAplikasi = {
  settingsMap: {},
  settingsRaw: [],
  formState: {},
  organizations: [],
  selectedOrgId: null,
  activeTab: 'identitas',
  defaults: {
    nama_aplikasi: 'Aplikasi Manajemen Risiko',
    footer_text: 'Hak Cipta Dilindungi Undang-Undang',
    versi_aplikasi: '1.0.0',
    email_admin: 'admin@example.com',
    nama_instansi: 'Nama Instansi',
    alamat_instansi: 'Alamat Instansi',
    telepon_instansi: '021-1234567',
    email_instansi: 'info@instansi.go.id',
    nama_jabatan_penandatangan: 'Kepala Unit',
    nama_pejabat_penandatangan: 'Nama Pejabat',
    logo_instansi: ''
  },

  async load() {
    console.log('PengaturanAplikasi.load() called');
    try {
      await Promise.all([this.loadSettings(), this.loadOrganizations()]);
      console.log('After loading, organizations count:', this.organizations?.length || 0);
      console.log('Organizations:', this.organizations);
      this.render();
    } catch (error) {
      console.error('Error in load():', error);
      this.render();
    }
  },

  normalizeKey(key = '') {
    return key.toString().trim();
  },

  setSettingValue(map, key, value) {
    const normalized = this.normalizeKey(key);
    if (!normalized) return;
    map[normalized] = value;
    map[normalized.toLowerCase()] = value;
  },

  async loadSettings() {
    try {
      const apiCallFn = window.apiCall || apiCall;
      const data = await apiCallFn('/api/pengaturan');
      this.settingsRaw = data || [];
      this.settingsMap = this.settingsRaw.reduce((acc, item) => {
        this.setSettingValue(acc, item.kunci_pengaturan, item.nilai_pengaturan || '');
        return acc;
      }, {});
      this.formState = { ...this.defaults, ...this.settingsMap };
    } catch (error) {
      console.error('Error load settings:', error);
      this.formState = { ...this.defaults };
    }
  },

  async loadOrganizations() {
    try {
      const apiCallFn = window.apiCall || apiCall;
      const orgs = await apiCallFn('/api/organizations');
      console.log('Loaded organizations from API:', orgs);
      console.log('Organizations type:', typeof orgs, 'Is array:', Array.isArray(orgs));
      
      if (!orgs || !Array.isArray(orgs)) {
        console.warn('Organizations is not an array:', orgs);
        this.organizations = [];
        return;
      }
      
      this.organizations = orgs.map(org => {
        const users = Array.isArray(org.users)
          ? org.users
          : Array.isArray(org.organization_users)
            ? org.organization_users
            : [];
        return {
          ...org,
          users,
          __forceReloadUsers: false
        };
      });
      
      if (!this.selectedOrgId && this.organizations.length > 0) {
        this.selectedOrgId = this.organizations[0].id;
      }

      console.log('Enriched organizations:', this.organizations);
      console.log('Organizations count after enrichment:', this.organizations.length);
      
      this.organizations.forEach(org => {
        console.log(`Org ${org.name} has ${org.users?.length || 0} users:`, org.users);
      });

      if (this.selectedOrgId) {
        await this.ensureOrganizationUsersLoaded(this.selectedOrgId, { force: false });
      }
    } catch (error) {
      console.error('Error load organizations:', error);
      console.error('Error details:', error.message, error.stack);
      this.organizations = [];
    }
  },

  render() {
    const content = document.getElementById('pengaturan-content');
    if (!content) return;
    content.innerHTML = `
      <div class="settings-tabs">
        <button class="settings-tab ${this.activeTab === 'identitas' ? 'active' : ''}" data-tab="identitas">
          <i class="fas fa-id-card"></i>
          <span>Identitas Aplikasi</span>
        </button>
        <button class="settings-tab ${this.activeTab === 'users' ? 'active' : ''}" data-tab="users">
          <i class="fas fa-users-cog"></i>
          <span>Manajemen User</span>
        </button>
        <button class="settings-tab ${this.activeTab === 'kode' ? 'active' : ''}" data-tab="kode">
          <i class="fas fa-barcode"></i>
          <span>Pengaturan Kode</span>
        </button>
      </div>
      <div class="settings-pane ${this.activeTab === 'identitas' ? 'active' : ''}" id="pane-identitas">
        ${this.renderIdentitasSection()}
      </div>
      <div class="settings-pane ${this.activeTab === 'users' ? 'active' : ''}" id="pane-users">
        ${this.renderUserManagementSection()}
      </div>
      <div class="settings-pane ${this.activeTab === 'kode' ? 'active' : ''}" id="pane-kode">
        ${this.renderKodeSettingsSection()}
      </div>
    `;
    this.bindEvents();
  },

  renderIdentitasSection() {
    return `
      <div class="section-card">
        <div class="section-header">
          <h3>Pengaturan Identitas Aplikasi</h3>
        </div>
        <form id="pengaturan-identitas-form" class="form-grid two-column">
          ${this.renderInput('Nama Aplikasi', 'nama_aplikasi')}
          ${this.renderInput('Versi Aplikasi', 'versi_aplikasi')}
          ${this.renderTextarea('Footer Aplikasi', 'footer_text')}
          ${this.renderInput('Email Administrator', 'email_admin', 'email')}
          ${this.renderInput('Nama Instansi', 'nama_instansi')}
          ${this.renderInput('Nama Jabatan Penandatangan', 'nama_jabatan_penandatangan')}
          ${this.renderInput('Nama Pejabat (Untuk Tanda Tangan)', 'nama_pejabat_penandatangan')}
          ${this.renderTextarea('Alamat Instansi', 'alamat_instansi')}
          ${this.renderInput('Telepon Instansi', 'telepon_instansi')}
          ${this.renderInput('Email Instansi', 'email_instansi', 'email')}
          <div class="form-group full-width">
            <label class="form-label">Logo Instansi</label>
            <div class="logo-upload">
              <input type="file" id="logo-instansi" accept="image/*" hidden>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-logo"><i class="fas fa-image"></i> Pilih Logo</button>
              <button type="button" class="btn btn-danger btn-sm" id="btn-remove-logo"><i class="fas fa-times"></i> Hapus Logo</button>
            </div>
            <div class="logo-preview" id="logo-preview">
              ${this.formState.logo_instansi ? `<img src="${this.formState.logo_instansi}" alt="Logo Instansi">` : '<span>Belum ada logo</span>'}
            </div>
          </div>
          <div class="form-actions full-width">
            <button type="button" class="btn btn-secondary" id="btn-identitas-cancel">Batalkan Perubahan</button>
            <button type="button" class="btn btn-warning" id="btn-identitas-reset">Reset ke Default</button>
            <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
          </div>
        </form>
      </div>
      <div class="section-card" style="margin-top: 2rem;">
        <div class="section-header">
          <h3>Organisasi</h3>
        </div>
        <form id="organization-form" class="form-grid two-column">
          <input type="hidden" id="org-id">
          ${this.renderTextInput('Nama Organisasi', 'org-name')}
          ${this.renderTextInput('Kode Organisasi', 'org-code')}
          ${this.renderTextareaInput('Deskripsi', 'org-description')}
          <div class="form-actions full-width">
            <button type="button" class="btn btn-secondary" id="btn-org-reset">Reset</button>
            <button type="submit" class="btn btn-primary">Simpan Organisasi</button>
          </div>
        </form>
      </div>
      ${this.renderOrganizationsPreview()}
    `;
  },

  renderUserManagementSection() {
    const selectedOrgId = this.selectedOrgId || '';
    const selectedOrg = this.organizations.find(org => org.id === selectedOrgId);
    
    return `
      <div class="section-card">
        <div class="section-header">
          <h3>Manajemen User</h3>
        </div>
        <div class="form-group">
          <label class="form-label">Pilih Organisasi</label>
          <select id="select-organization" class="form-control">
            <option value="">-- Pilih Organisasi --</option>
            ${this.organizations.map(org => 
              `<option value="${org.id}" ${org.id === selectedOrgId ? 'selected' : ''}>${org.name} ${org.code ? `(${org.code})` : ''}</option>`
            ).join('')}
          </select>
        </div>
        ${selectedOrg ? `
          <div id="user-management-form" style="margin-top: 1.5rem;">
            <div class="section-header" style="padding: 0; margin-bottom: 1rem;">
              <h4>Tambah User ke ${selectedOrg.name}</h4>
            </div>
            <form id="add-user-form" class="form-grid two-column">
              <div class="form-group">
                <label class="form-label">Nama User</label>
                <input type="text" id="new-user-name" class="form-control" required placeholder="Nama Lengkap">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="new-user-email" class="form-control" required placeholder="user@example.com">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="new-user-password" class="form-control" required placeholder="Minimal 8 karakter" minlength="8">
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select id="new-user-role" class="form-control">
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div class="form-actions full-width">
                <button type="submit" class="btn btn-primary">Tambah User</button>
              </div>
            </form>
          </div>
          <div style="margin-top: 2rem;">
            <div class="section-header" style="padding: 0; margin-bottom: 1rem;">
              <h4>Daftar User di ${selectedOrg.name}</h4>
            </div>
            ${this.renderOrgUsersTable(selectedOrg)}
          </div>
        ` : `
          <div style="margin-top: 1.5rem; padding: 2rem; text-align: center; color: #666;">
            <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Pilih organisasi terlebih dahulu untuk menambahkan user</p>
          </div>
        `}
      </div>
    `;
  },

  renderKodeSettingsSection() {
    const kodeSettings = this.getKodeSettings();
    if (!kodeSettings.length) {
      return `
        <div class="section-card">
          <div class="section-header">
            <h3><i class="fas fa-info-circle"></i> Pengaturan Kode Belum Tersedia</h3>
          </div>
          <p class="text-muted">Pastikan tabel <strong>pengaturan_aplikasi</strong> memiliki entri dengan kategori kode atau kunci yang diawali dengan <code>kode_</code> / <code>prefix_</code>.</p>
        </div>
      `;
    }

    return `
      <div class="section-card">
        <div class="section-header">
          <h3><i class="fas fa-barcode"></i> Pengaturan Kode Otomatis</h3>
          <p class="text-muted">Atur prefix, format, dan counter untuk seluruh modul kode otomatis.</p>
        </div>
        <form id="pengaturan-kode-form" class="form-grid two-column">
          ${kodeSettings.map((setting) => this.renderKodeInput(setting)).join('')}
          <div class="form-actions full-width">
            <button type="button" class="btn btn-secondary" id="btn-kode-reset">Kembalikan Nilai Awal</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Simpan Pengaturan Kode
            </button>
          </div>
        </form>
      </div>
    `;
  },

  renderKodeInput(setting) {
    const key = setting.kunci_pengaturan;
    const value = this.formState[key] || '';
    const label = setting.label_pengaturan || this.prettyKey(key);
    const description = setting.deskripsi || 'Sesuaikan format kode sesuai kebutuhan organisasi.';
    const inputType = setting.tipe_input === 'number' ? 'number' : 'text';
    const icon = this.resolveKodeIcon(key);
    const placeholder = setting.placeholder || 'Contoh: RS-2025-001';

    return `
      <div class="form-group">
        <label class="form-label">
          <i class="form-label-icon fas ${icon}"></i>
          ${label}
        </label>
        <input
          type="${inputType}"
          class="form-control kode-input"
          data-key="${key}"
          value="${value}"
          placeholder="${placeholder}"
        >
        <small class="form-hint">${description}</small>
      </div>
    `;
  },

  renderOrganizationsPreview() {
    // Ensure organizations is an array
    const orgs = Array.isArray(this.organizations) ? this.organizations : [];
    console.log('Rendering organizations preview, count:', orgs.length);
    console.log('Organizations data:', orgs);
    
    if (orgs.length === 0) {
      return `
        <div class="section-card" style="margin-top: 2rem;">
          <div class="section-header">
            <h3>Daftar Organisasi</h3>
          </div>
          <p class="text-muted" style="padding: 2rem; text-align: center;">Belum ada organisasi. Silakan tambahkan organisasi di atas.</p>
        </div>
      `;
    }
    
    return `
      <div class="section-card" style="margin-top: 2rem;">
        <div class="section-header">
          <h3>Daftar Organisasi</h3>
        </div>
        <table style="width: 100%;">
          <thead>
            <tr>
              <th>Nama Organisasi</th>
              <th>Kode</th>
              <th>Deskripsi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${orgs
              .map(
                (org) => `
              <tr>
                <td>${org.name || '-'}</td>
                <td>${org.code || '-'}</td>
                <td>${org.description || '-'}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" data-action="edit-org" data-org="${org.id}" onclick="PengaturanAplikasi.populateOrgForm('${org.id}')">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  <button class="btn btn-danger btn-sm" data-action="delete-org" data-org="${org.id}" onclick="PengaturanAplikasi.deleteOrganization('${org.id}')" style="margin-left: 0.5rem;">
                    <i class="fas fa-trash"></i> Hapus
                  </button>
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderOrgUsersTable(org) {
    console.log('Rendering org users table for org:', org);
    console.log('Org users:', org.users);
    console.log('Org users length:', org.users?.length);
    
    // Ensure users is an array
    const users = Array.isArray(org.users) ? org.users : [];
    
    if (users.length === 0) {
      return '<p class="text-muted">Belum ada user pada organisasi ini.</p>';
    }
    
    return `
      <table style="width: 100%;">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Organisasi</th>
            <th>Role</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (user) => {
                const fullName = user.user_profiles?.full_name || user.full_name || '-';
                const email = user.user_profiles?.email || user.email || '-';
                const role = user.role || 'manager';
                const organizationName = user.user_profiles?.organization_name || org.name || '-';
                const organizationCode = user.user_profiles?.organization_code || org.code || '';
                const organizationLabel = organizationCode ? `${organizationName} (${organizationCode})` : organizationName;
                return `
            <tr>
              <td>${fullName}</td>
              <td>${email}</td>
              <td>${organizationLabel}</td>
              <td>
                <select class="form-control org-users-role" data-user-id="${user.id}" data-org="${org.id}" onchange="PengaturanAplikasi.updateUserRole('${user.id}', this.value)">
                  ${this.renderRoleOption('superadmin', role)}
                  ${this.renderRoleOption('admin', role)}
                  ${this.renderRoleOption('manager', role)}
                </select>
              </td>
              <td>
                <button class="btn btn-danger btn-sm" data-action="remove-user" data-user="${user.id}" onclick="PengaturanAplikasi.removeOrgUser('${user.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>`;
              }
            )
            .join('')}
        </tbody>
      </table>
    `;
  },

  renderUserModal() {
    // Check if current user is superadmin
    const currentUser = window.currentUser || {};
    const isSuperAdmin = currentUser.profile?.role === 'superadmin' || currentUser.email === 'mukhsin9@gmail.com';
    
    return `
      <div id="org-user-modal" class="modal" style="display:none;">
        <div class="modal-content" style="max-width:500px;">
          <div class="modal-header">
            <h3 class="modal-title">Tambah User ke Organisasi</h3>
            <button class="modal-close" onclick="PengaturanAplikasi.closeUserModal()">&times;</button>
          </div>
          <form id="org-user-form">
            <input type="hidden" id="org-user-org-id">
            <div class="form-group">
              <label class="form-label">
                <input type="radio" name="user-type" value="existing" checked id="user-type-existing" onchange="PengaturanAplikasi.toggleUserType()">
                <span style="margin-left: 8px;">User yang sudah ada</span>
              </label>
              <label class="form-label">
                <input type="radio" name="user-type" value="new" id="user-type-new" onchange="PengaturanAplikasi.toggleUserType()" ${!isSuperAdmin ? 'disabled' : ''}>
                <span style="margin-left: 8px;">Daftarkan user baru ${!isSuperAdmin ? '(Hanya Superadmin)' : ''}</span>
              </label>
            </div>
            <div id="existing-user-fields">
              <div class="form-group">
                <label class="form-label">Email User</label>
                <input type="email" id="org-user-email" class="form-control" placeholder="user@example.com">
              </div>
            </div>
            <div id="new-user-fields" style="display:none;">
              <div class="form-group">
                <label class="form-label">Nama Lengkap</label>
                <input type="text" id="org-user-name" class="form-control" placeholder="Nama Lengkap">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="org-user-new-email" class="form-control" placeholder="user@example.com">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="org-user-password" class="form-control" placeholder="Minimal 8 karakter">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select id="org-user-role" class="form-control">
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="PengaturanAplikasi.closeUserModal()">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderRoleOption(role, current) {
    return `<option value="${role}" ${role === current ? 'selected' : ''}>${role.charAt(0).toUpperCase() + role.slice(1)}</option>`;
  },

  renderInput(label, key, type = 'text') {
    return `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <input type="${type}" class="form-control identitas-input" data-key="${key}" value="${this.formState[key] || ''}">
      </div>
    `;
  },

  renderTextarea(label, key) {
    return `
      <div class="form-group full-width">
        <label class="form-label">${label}</label>
        <textarea class="form-control identitas-input" data-key="${key}" rows="2">${this.formState[key] || ''}</textarea>
      </div>
    `;
  },

  renderTextInput(label, id, type = 'text') {
    return `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <input type="${type}" id="${id}" class="form-control">
      </div>
    `;
  },

  renderTextareaInput(label, id) {
    return `
      <div class="form-group full-width">
        <label class="form-label">${label}</label>
        <textarea id="${id}" class="form-control" rows="2"></textarea>
      </div>
    `;
  },

  bindEvents() {
    document.querySelectorAll('.settings-tab').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.dataset.tab;
        this.render();
      });
    });

    this.bindIdentitasEvents();
    this.bindOrganizationEvents();
    this.bindUserModalEvents();
    this.bindKodeEvents();
  },

  bindIdentitasEvents() {
    const form = document.getElementById('pengaturan-identitas-form');
    if (!form) return;
    form.querySelectorAll('.identitas-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        this.formState[key] = e.target.value;
      });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveIdentitas();
    });
    document.getElementById('btn-identitas-reset')?.addEventListener('click', () => this.resetToDefault());
    document.getElementById('btn-identitas-cancel')?.addEventListener('click', () => this.cancelChanges());
    document.getElementById('btn-upload-logo')?.addEventListener('click', () => document.getElementById('logo-instansi')?.click());
    document.getElementById('logo-instansi')?.addEventListener('change', (e) => this.handleLogoUpload(e));
    document.getElementById('btn-remove-logo')?.addEventListener('click', () => {
      this.formState.logo_instansi = '';
      this.render();
    });
  },

  bindKodeEvents() {
    const form = document.getElementById('pengaturan-kode-form');
    if (!form) return;

    form.querySelectorAll('.kode-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        this.formState[key] = e.target.value;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveKodeSettings();
    });

    document.getElementById('btn-kode-reset')?.addEventListener('click', () => this.resetKodeSettings());
  },

  bindOrganizationEvents() {
    // Form organisasi di tab Identitas Aplikasi
    const orgForm = document.getElementById('organization-form');
    if (orgForm) {
      orgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveOrganization();
      });
    }
    document.getElementById('btn-org-reset')?.addEventListener('click', () => this.resetOrgForm());

    // Form tambah user di tab Manajemen User
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
      addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addUserToSelectedOrganization();
      });
    }

    const selectOrg = document.getElementById('select-organization');
    if (selectOrg) {
      selectOrg.addEventListener('change', (e) => {
        this.selectOrganization(e.target.value);
      });
    }

    // Event handlers untuk edit/delete organisasi (sudah menggunakan onclick di render)
    // Event handlers untuk update role dan remove user (sudah menggunakan onclick di render)
  },

  async selectOrganization(orgId) {
    this.selectedOrgId = orgId || null;
    
    if (this.selectedOrgId) {
      await this.ensureOrganizationUsersLoaded(this.selectedOrgId);
    }
    
    this.render();
  },

  async ensureOrganizationUsersLoaded(orgId, { force = false } = {}) {
    if (!orgId) return;
    
    const targetOrgIndex = this.organizations.findIndex(org => org.id === orgId);
    if (targetOrgIndex === -1) return;
    
    const targetOrg = this.organizations[targetOrgIndex];
    if (targetOrg.__loadingUsers) return;

    if (!force && Array.isArray(targetOrg.users) && targetOrg.users.length > 0 && !targetOrg.__forceReloadUsers) {
      return;
    }
    
    try {
      this.organizations[targetOrgIndex] = { ...targetOrg, __loadingUsers: true };
      const apiCallFn = window.apiCall || apiCall;
      const users = await apiCallFn(`/api/organizations/${orgId}/users`);
      this.organizations[targetOrgIndex] = {
        ...targetOrg,
        users: Array.isArray(users) ? users : [],
        __forceReloadUsers: false,
        __loadingUsers: false
      };
      console.log(`ensureOrganizationUsersLoaded: loaded ${this.organizations[targetOrgIndex].users.length} users for org ${orgId}`);
    } catch (error) {
      console.error(`Error loading users for organization ${orgId}:`, error);
      this.organizations[targetOrgIndex] = {
        ...targetOrg,
        users: [],
        __forceReloadUsers: false,
        __loadingUsers: false
      };
    }
  },

  async addUserToSelectedOrganization() {
    const orgId = this.selectedOrgId;
    if (!orgId) {
      alert('Pilih organisasi terlebih dahulu');
      return;
    }

    const fullName = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    if (!fullName || !email || !password) {
      alert('Nama, email, dan password wajib diisi');
      return;
    }

    if (password.length < 8) {
      alert('Password minimal 8 karakter');
      return;
    }

    try {
      // Check if current user is superadmin
      const currentUser = window.currentUser || {};
      const isSuperAdmin = currentUser.profile?.role === 'superadmin' || currentUser.email === 'mukhsin9@gmail.com';
      
      if (!isSuperAdmin) {
        alert('Hanya superadmin yang dapat mendaftarkan user baru');
        return;
      }

      // Register new user
      await apiCall('/api/auth/register-admin', {
        method: 'POST',
        body: { email, password, full_name: fullName, role }
      });

      // Add user to organization
      await apiCall(`/api/organizations/${orgId}/users`, {
        method: 'POST',
        body: { email, role }
      });

      // Reset form
      document.getElementById('add-user-form').reset();
      
      // Preserve selectedOrgId and activeTab before reload
      const currentSelectedOrgId = this.selectedOrgId;
      const currentActiveTab = this.activeTab || 'users';
      
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force reload users for the selected organization
      console.log('Reloading users for organization after adding user...');
      await this.ensureOrganizationUsersLoaded(currentSelectedOrgId, { force: true });
      
      // Restore selectedOrgId and activeTab
      this.selectedOrgId = currentSelectedOrgId;
      this.activeTab = currentActiveTab;
      
      // Find the selected organization in the data
      const selectedOrg = this.organizations.find(org => org.id === currentSelectedOrgId);
      if (selectedOrg) {
        console.log('Selected org after reload:', selectedOrg);
        console.log('Users in selected org:', selectedOrg.users);
        console.log('Users count:', selectedOrg.users?.length || 0);
      } else {
        console.warn('Selected organization not found after reload!');
      }
      
      // Force re-render to update the preview table
      console.log('Rendering after adding user...');
      this.render();
      console.log('Render completed');
      
      // Show success message after render
      setTimeout(() => {
        alert('User berhasil ditambahkan ke organisasi');
      }, 100);
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error: ' + error.message);
    }
  },

  async saveKodeSettings() {
    const kodeSettings = this.getKodeSettings();
    if (!kodeSettings.length) {
      alert('Tidak ada pengaturan kode yang bisa disimpan');
      return;
    }

    try {
      const payload = kodeSettings.map((setting) => ({
        kunci_pengaturan: setting.kunci_pengaturan,
        nilai_pengaturan: this.formState[setting.kunci_pengaturan] || ''
      }));

      await apiCall('/api/pengaturan', {
        method: 'PUT',
        body: { pengaturan: payload }
      });

      alert('Pengaturan kode berhasil disimpan');
      await this.loadSettings();
      this.render();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  },

  resetKodeSettings() {
    const kodeSettings = this.getKodeSettings();
    kodeSettings.forEach((setting) => {
      const key = setting.kunci_pengaturan;
      this.formState[key] = this.settingsMap[key] || '';
    });
    this.render();
  },

  bindUserModalEvents() {
    const modalForm = document.getElementById('org-user-form');
    if (modalForm) {
      modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.assignUserToOrganization();
      });
    }
  },

  async saveIdentitas() {
    try {
      const payload = Object.keys(this.formState).map((key) => ({
        kunci_pengaturan: key,
        nilai_pengaturan: this.formState[key]
      }));
      await apiCall('/api/pengaturan', {
        method: 'PUT',
        body: { pengaturan: payload }
      });
      alert('Pengaturan berhasil disimpan');
      await this.loadSettings();
      window.app?.setKopHeaderState?.(this.formState);
      window.app?.refreshKopHeader?.(true);
      this.render();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  },

  resetToDefault() {
    const nextState = { ...this.formState };
    Object.keys(this.defaults).forEach((key) => {
      nextState[key] = this.defaults[key];
    });
    this.formState = nextState;
    this.render();
  },

  cancelChanges() {
    this.formState = { ...this.defaults, ...this.settingsMap };
    this.render();
  },

  async handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.formState.logo_instansi = reader.result;
      this.render();
    };
    reader.readAsDataURL(file);
  },

  resetOrgForm() {
    const form = document.getElementById('organization-form');
    if (!form) return;
    form.reset();
    form.querySelector('#org-id').value = '';
  },

  populateOrgForm(orgId) {
    const org = this.organizations.find((item) => item.id === orgId);
    if (!org) return;
    
    // Switch to identitas tab if not already there
    if (this.activeTab !== 'identitas') {
      this.activeTab = 'identitas';
      this.render();
      // Wait for form to be rendered
      setTimeout(() => {
        this.populateOrgForm(orgId);
      }, 100);
      return;
    }
    
    const form = document.getElementById('organization-form');
    if (!form) return;
    form.querySelector('#org-id').value = org.id;
    form.querySelector('#org-name').value = org.name || '';
    form.querySelector('#org-code').value = org.code || '';
    form.querySelector('#org-description').value = org.description || '';
    form.scrollIntoView({ behavior: 'smooth' });
  },

  async saveOrganization() {
    const form = document.getElementById('organization-form');
    if (!form) return;
    const id = form.querySelector('#org-id').value;
    const payload = {
      name: form.querySelector('#org-name').value,
      code: form.querySelector('#org-code').value,
      description: form.querySelector('#org-description').value
    };
    if (!payload.name) {
      alert('Nama organisasi wajib diisi');
      return;
    }
    try {
      // Use window.apiCall to ensure we're using the correct function
      const apiCallFn = window.apiCall || apiCall;
      const result = await apiCallFn(`/api/organizations${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: payload
      });
      console.log('Save organization result:', result);
      
      // Reset form first
      this.resetOrgForm();
      
      // Reload organizations to refresh the preview table
      console.log('Loading organizations after save...');
      await this.loadOrganizations();
      console.log('Organizations after reload:', this.organizations);
      console.log('Organizations count:', this.organizations?.length || 0);
      
      // Double check that data is loaded
      if (!this.organizations || this.organizations.length === 0) {
        console.warn('WARNING: Organizations array is empty after reload!');
        // Try loading again
        await this.loadOrganizations();
        console.log('After second load, organizations count:', this.organizations?.length || 0);
      }
      
      // Ensure we stay on identitas tab to show the preview
      this.activeTab = 'identitas';
      
      // Force re-render to update the preview table
      console.log('Rendering after save...');
      console.log('Current organizations before render:', this.organizations);
      this.render();
      console.log('Render completed');
      
      // Show success message after render
      setTimeout(() => {
        alert('Organisasi berhasil disimpan');
      }, 100);
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Error: ' + error.message);
    }
  },

  async deleteOrganization(orgId) {
    if (!confirm('Hapus organisasi ini?')) return;
    try {
      const apiCallFn = window.apiCall || apiCall;
      await apiCallFn(`/api/organizations/${orgId}`, { method: 'DELETE' });
      // Clear selected org if it was deleted
      if (this.selectedOrgId === orgId) {
        this.selectedOrgId = null;
      }
      await this.loadOrganizations();
      // Ensure we stay on identitas tab to show the preview
      this.activeTab = 'identitas';
      this.render();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  },

  openUserModal(orgId) {
    const modal = document.getElementById('org-user-modal');
    if (!modal) return;
    document.getElementById('org-user-org-id').value = orgId;
    document.getElementById('org-user-email').value = '';
    document.getElementById('org-user-name').value = '';
    document.getElementById('org-user-new-email').value = '';
    document.getElementById('org-user-password').value = '';
    document.getElementById('org-user-role').value = 'manager';
    document.getElementById('user-type-existing').checked = true;
    this.toggleUserType();
    modal.style.display = 'flex';
  },

  closeUserModal() {
    const modal = document.getElementById('org-user-modal');
    if (modal) modal.style.display = 'none';
  },

  toggleUserType() {
    const userType = document.querySelector('input[name="user-type"]:checked')?.value;
    const existingFields = document.getElementById('existing-user-fields');
    const newFields = document.getElementById('new-user-fields');
    
    if (userType === 'new') {
      existingFields.style.display = 'none';
      newFields.style.display = 'block';
      document.getElementById('org-user-email').required = false;
      document.getElementById('org-user-name').required = true;
      document.getElementById('org-user-new-email').required = true;
      document.getElementById('org-user-password').required = true;
    } else {
      existingFields.style.display = 'block';
      newFields.style.display = 'none';
      document.getElementById('org-user-email').required = true;
      document.getElementById('org-user-name').required = false;
      document.getElementById('org-user-new-email').required = false;
      document.getElementById('org-user-password').required = false;
    }
  },

  async assignUserToOrganization() {
    const orgId = document.getElementById('org-user-org-id').value;
    const userType = document.querySelector('input[name="user-type"]:checked')?.value;
    const role = document.getElementById('org-user-role').value;
    
    if (!orgId) {
      alert('Organisasi tidak valid');
      return;
    }

    try {
      if (userType === 'new') {
        // Register new user
        const fullName = document.getElementById('org-user-name').value;
        const email = document.getElementById('org-user-new-email').value;
        const password = document.getElementById('org-user-password').value;
        
        if (!fullName || !email || !password) {
          alert('Nama, email, dan password wajib diisi');
          return;
        }
        
        if (password.length < 8) {
          alert('Password minimal 8 karakter');
          return;
        }

        // Register user first
        const registerResult = await apiCall('/api/auth/register-admin', {
          method: 'POST',
          body: { email, password, full_name: fullName, role }
        });

        // Then add to organization
        await apiCall(`/api/organizations/${orgId}/users`, {
          method: 'POST',
          body: { email, role }
        });
      } else {
        // Add existing user
        const email = document.getElementById('org-user-email').value;
        if (!email) {
          alert('Email user wajib diisi');
          return;
        }
        
        await apiCall(`/api/organizations/${orgId}/users`, {
          method: 'POST',
          body: { email, role }
        });
      }
      
      this.closeUserModal();
      await this.loadOrganizations();
      this.render();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  },

  async updateUserRole(recordId, role) {
    try {
      const currentSelectedOrg = this.selectedOrgId;
      const currentActiveTab = this.activeTab;
      
      await apiCall(`/api/organizations/users/${recordId}`, {
        method: 'PUT',
        body: { role }
      });
      
      // Force reload users for the selected organization
      if (currentSelectedOrg) {
        await this.ensureOrganizationUsersLoaded(currentSelectedOrg, { force: true });
      }
      
      // Restore state and re-render
      this.selectedOrgId = currentSelectedOrg;
      this.activeTab = currentActiveTab;
      this.render();
      
      alert('Role berhasil diupdate');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error: ' + error.message);
    }
  },

  async removeOrgUser(recordId) {
    if (!confirm('Hapus user dari organisasi?')) return;
    try {
      const currentSelectedOrg = this.selectedOrgId;
      const currentActiveTab = this.activeTab;
      
      await apiCall(`/api/organizations/users/${recordId}`, { method: 'DELETE' });
      
      // Force reload users for the selected organization
      if (currentSelectedOrg) {
        await this.ensureOrganizationUsersLoaded(currentSelectedOrg, { force: true });
      }
      
      // Restore state and re-render
      this.selectedOrgId = currentSelectedOrg;
      this.activeTab = currentActiveTab;
      this.render();
      
      alert('User berhasil dihapus dari organisasi');
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Error: ' + error.message);
    }
  },

  getKodeSettings() {
    if (!Array.isArray(this.settingsRaw)) return [];
    return this.settingsRaw.filter((item) => {
      if (!item?.kunci_pengaturan) return false;
      const kategori = (item.kategori || '').toLowerCase();
      if (['kode', 'kode_otomatis', 'code'].includes(kategori)) return true;
      const key = item.kunci_pengaturan.toLowerCase();
      return key.startsWith('kode_') || key.startsWith('prefix_') || key.endsWith('_prefix') || key.includes('_kode');
    });
  },

  prettyKey(key = '') {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  },

  resolveKodeIcon(key = '') {
    const map = [
      { match: 'peluang', icon: 'fa-lightbulb' },
      { match: 'loss', icon: 'fa-exclamation-triangle' },
      { match: 'ews', icon: 'fa-bell' },
      { match: 'kri', icon: 'fa-tachometer-alt' },
      { match: 'risiko', icon: 'fa-file-alt' },
      { match: 'rencana', icon: 'fa-chart-line' },
      { match: 'pengajuan', icon: 'fa-paper-plane' }
    ];
    const found = map.find((item) => key.toLowerCase().includes(item.match));
    return found ? found.icon : 'fa-barcode';
  }
};

window.PengaturanAplikasi = PengaturanAplikasi;
window.pengaturanModule = PengaturanAplikasi;

