// User Management Module - Tab untuk Risk Profile
const UserManagementModule = (() => {
  const state = {
    users: [],
    organizations: [],
    currentUser: null,
    filters: {
      organization_id: '',
      role: '',
      search: ''
    },
    editingUser: null
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    try {
      await Promise.all([fetchUsers(), fetchOrganizations()]);
      render();
    } catch (error) {
      console.error('Error loading user management:', error);
      showError('Gagal memuat data user management');
    }
  }

  async function fetchUsers() {
    try {
      const params = new URLSearchParams();
      if (state.filters.organization_id) {
        params.append('organization_id', state.filters.organization_id);
      }

      const url = `/api/user-management${params.toString() ? '?' + params.toString() : ''}`;
      const data = await api()(url);
      state.users = data || [];
      console.log('Users loaded:', state.users.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      state.users = [];
      throw error;
    }
  }

  async function fetchOrganizations() {
    try {
      const data = await api()('/api/user-management/organizations/list');
      state.organizations = data || [];
      console.log('Organizations loaded:', state.organizations.length);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      state.organizations = [];
    }
  }

  function render() {
    const container = document.getElementById('user-management-content');
    if (!container) {
      console.error('Container #user-management-content not found!');
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-users"></i> Manajemen User
            <span class="badge badge-info">${state.users.length} user</span>
          </h3>
          <div class="card-tools">
            <button class="btn btn-success" onclick="UserManagementModule.showCreateModal()">
              <i class="fas fa-plus"></i> Tambah User
            </button>
            <button class="btn btn-primary" onclick="UserManagementModule.refresh()">
              <i class="fas fa-sync"></i> Refresh
            </button>
          </div>
        </div>
        <div class="card-body">
          ${renderFilters()}
          ${renderUserTable()}
        </div>
      </div>
      ${renderModals()}
    `;
  }

  function renderFilters() {
    return `
      <div class="filter-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Organisasi</label>
          <select class="form-control" id="filter-organization" onchange="UserManagementModule.applyFilter()">
            <option value="">Semua Organisasi</option>
            ${state.organizations.map(org => `
              <option value="${org.id}" ${state.filters.organization_id === org.id ? 'selected' : ''}>
                ${org.name} (${org.code})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Role</label>
          <select class="form-control" id="filter-role" onchange="UserManagementModule.applyFilter()">
            <option value="">Semua Role</option>
            <option value="superadmin" ${state.filters.role === 'superadmin' ? 'selected' : ''}>Super Admin</option>
            <option value="admin" ${state.filters.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="manager" ${state.filters.role === 'manager' ? 'selected' : ''}>Manager</option>
            <option value="user" ${state.filters.role === 'user' ? 'selected' : ''}>User</option>
          </select>
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 0.875rem; font-weight: 600;">Pencarian</label>
          <input type="text" class="form-control" id="filter-search" placeholder="Cari nama atau email..." 
                 value="${state.filters.search}" onkeyup="UserManagementModule.applyFilter()">
        </div>
      </div>
    `;
  }

  function renderUserTable() {
    const filteredUsers = filterUsers();
    
    if (filteredUsers.length === 0) {
      return `
        <div style="text-align: center; padding: 2rem; color: #999;">
          <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
          <p>Tidak ada user yang ditemukan</p>
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>Role</th>
              <th>Organisasi</th>
              <th>Status</th>
              <th>Login Terakhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${filteredUsers.map(user => `
              <tr>
                <td>
                  <strong>${user.full_name || '-'}</strong>
                  <br>
                  <small class="text-muted">ID: ${user.id.substring(0, 8)}...</small>
                </td>
                <td>
                  ${user.email || '-'}
                  ${user.email_confirmed ? 
                    '<br><span class="badge badge-success">Terverifikasi</span>' : 
                    '<br><span class="badge badge-warning">Belum Verifikasi</span>'
                  }
                </td>
                <td>
                  <span class="badge badge-${getRoleBadgeColor(user.role)}">
                    ${getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td>
                  ${user.organizations?.name || user.organization_name || '-'}
                  ${user.organizations?.code ? `<br><small class="text-muted">${user.organizations.code}</small>` : ''}
                </td>
                <td>
                  ${user.email_confirmed ? 
                    '<span class="badge badge-success">Aktif</span>' : 
                    '<span class="badge badge-secondary">Pending</span>'
                  }
                </td>
                <td>
                  ${user.last_sign_in ? 
                    formatDateTime(user.last_sign_in) : 
                    '<span class="text-muted">Belum pernah login</span>'
                  }
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info" onclick="UserManagementModule.showEditModal('${user.id}')" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="UserManagementModule.showResetPasswordModal('${user.id}')" title="Reset Password">
                      <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="UserManagementModule.confirmDelete('${user.id}', '${user.full_name}')" title="Hapus">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderModals() {
    return `
      <!-- Edit User Modal -->
      <div class="modal fade" id="editUserModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-edit"></i> Edit User
              </h5>
              <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form id="editUserForm">
                <div class="form-group">
                  <label>Nama Lengkap *</label>
                  <input type="text" class="form-control" id="edit-full-name" required>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-control" id="edit-email">
                  <small class="form-text text-muted">Kosongkan jika tidak ingin mengubah email</small>
                </div>
                <div class="form-group">
                  <label>Role *</label>
                  <select class="form-control" id="edit-role" required>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Organisasi</label>
                  <select class="form-control" id="edit-organization">
                    <option value="">Pilih Organisasi</option>
                    ${state.organizations.map(org => `
                      <option value="${org.id}">${org.name} (${org.code})</option>
                    `).join('')}
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
              <button type="button" class="btn btn-primary" onclick="UserManagementModule.saveUser()">
                <i class="fas fa-save"></i> Simpan
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div class="modal fade" id="resetPasswordModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-key"></i> Reset Password
              </h5>
              <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <form id="resetPasswordForm">
                <div class="form-group">
                  <label>Password Baru *</label>
                  <input type="password" class="form-control" id="new-password" required minlength="6">
                  <small class="form-text text-muted">Minimal 6 karakter</small>
                </div>
                <div class="form-group">
                  <label>Konfirmasi Password *</label>
                  <input type="password" class="form-control" id="confirm-password" required minlength="6">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
              <button type="button" class="btn btn-warning" onclick="UserManagementModule.resetPassword()">
                <i class="fas fa-key"></i> Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function filterUsers() {
    let filtered = [...state.users];

    // Filter by organization
    if (state.filters.organization_id) {
      filtered = filtered.filter(user => user.organization_id === state.filters.organization_id);
    }

    // Filter by role
    if (state.filters.role) {
      filtered = filtered.filter(user => user.role === state.filters.role);
    }

    // Filter by search
    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        (user.full_name && user.full_name.toLowerCase().includes(search)) ||
        (user.email && user.email.toLowerCase().includes(search))
      );
    }

    return filtered;
  }

  function getRoleBadgeColor(role) {
    const colors = {
      'superadmin': 'danger',
      'admin': 'warning',
      'manager': 'info',
      'user': 'secondary'
    };
    return colors[role] || 'secondary';
  }

  function getRoleDisplayName(role) {
    const names = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'manager': 'Manager',
      'user': 'User'
    };
    return names[role] || role;
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function showError(message) {
    // Simple error display - could be enhanced with toast notifications
    alert('Error: ' + message);
  }

  function showSuccess(message) {
    // Simple success display - could be enhanced with toast notifications
    alert('Success: ' + message);
  }

  // Public methods
  async function applyFilter() {
    state.filters.organization_id = document.getElementById('filter-organization')?.value || '';
    state.filters.role = document.getElementById('filter-role')?.value || '';
    state.filters.search = document.getElementById('filter-search')?.value || '';
    
    await fetchUsers();
    render();
  }

  async function refresh() {
    await load();
    showSuccess('Data berhasil di-refresh');
  }

  async function showEditModal(userId) {
    try {
      const user = state.users.find(u => u.id === userId);
      if (!user) {
        showError('User tidak ditemukan');
        return;
      }

      state.editingUser = user;

      // Populate form
      document.getElementById('edit-full-name').value = user.full_name || '';
      document.getElementById('edit-email').value = user.email || '';
      document.getElementById('edit-role').value = user.role || 'user';
      document.getElementById('edit-organization').value = user.organization_id || '';

      // Show modal (assuming Bootstrap is available)
      $('#editUserModal').modal('show');
    } catch (error) {
      console.error('Error showing edit modal:', error);
      showError('Gagal membuka form edit');
    }
  }

  async function saveUser() {
    try {
      if (!state.editingUser) return;

      const formData = {
        full_name: document.getElementById('edit-full-name').value,
        email: document.getElementById('edit-email').value,
        role: document.getElementById('edit-role').value,
        organization_id: document.getElementById('edit-organization').value
      };

      // Validate
      if (!formData.full_name || !formData.role) {
        showError('Nama lengkap dan role wajib diisi');
        return;
      }

      const response = await api()(`/api/user-management/${state.editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      $('#editUserModal').modal('hide');
      await fetchUsers();
      render();
      showSuccess('User berhasil diupdate');
    } catch (error) {
      console.error('Error saving user:', error);
      showError('Gagal menyimpan user: ' + error.message);
    }
  }

  async function showResetPasswordModal(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) {
      showError('User tidak ditemukan');
      return;
    }

    state.editingUser = user;
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    $('#resetPasswordModal').modal('show');
  }

  async function resetPassword() {
    try {
      if (!state.editingUser) return;

      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!newPassword || newPassword.length < 6) {
        showError('Password minimal 6 karakter');
        return;
      }

      if (newPassword !== confirmPassword) {
        showError('Konfirmasi password tidak cocok');
        return;
      }

      await api()(`/api/user-management/${state.editingUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      });

      $('#resetPasswordModal').modal('hide');
      showSuccess('Password berhasil direset');
    } catch (error) {
      console.error('Error resetting password:', error);
      showError('Gagal reset password: ' + error.message);
    }
  }

  async function confirmDelete(userId, userName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await api()(`/api/user-management/${userId}`, {
        method: 'DELETE'
      });

      await fetchUsers();
      render();
      showSuccess('User berhasil dihapus');
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Gagal menghapus user: ' + error.message);
    }
  }

  function showCreateModal() {
    showError('Fitur tambah user belum diimplementasi. Gunakan sistem registrasi standar.');
  }

  return {
    load,
    applyFilter,
    refresh,
    showEditModal,
    saveUser,
    showResetPasswordModal,
    resetPassword,
    confirmDelete,
    showCreateModal
  };
})();

// Export untuk digunakan di window
window.UserManagementModule = UserManagementModule;