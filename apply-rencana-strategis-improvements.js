/**
 * Script to apply improvements to Rencana Strategis page
 * Implements the requested UI changes:
 * 1. Remove header text and toggle view button
 * 2. Position buttons on the right side
 * 3. Improve card design with soft colors
 * 4. Arrange action buttons neatly
 */

const fs = require('fs');
const path = require('path');

// Read the current rencana-strategis.js file
const jsFilePath = path.join(__dirname, 'public/js/rencana-strategis.js');
const cssFilePath = path.join(__dirname, 'public/css/rencana-strategis-enhanced.css');

console.log('🔧 Applying improvements to Rencana Strategis...');

// Create improved CSS
const improvedCSS = `
/* Improved Rencana Strategis Styles */

/* Remove header section styling */
.rencana-strategis-header {
    display: none !important;
}

/* Card Hover Effects */
.card-hover {
    transition: all 0.3s ease;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    overflow: hidden;
}

.card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    border-color: rgba(0,0,0,0.12);
}

/* Soft Gradient Backgrounds for Card Headers */
.bg-gradient-success {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%) !important;
    color: #155724 !important;
}

.bg-gradient-warning {
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%) !important;
    color: #856404 !important;
}

.bg-gradient-info {
    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%) !important;
    color: #0c5460 !important;
}

.bg-gradient-primary {
    background: linear-gradient(135deg, #cce7ff 0%, #b3d9ff 100%) !important;
    color: #004085 !important;
}

/* Action Buttons Container - Right Aligned */
.action-buttons-container {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

/* Button Styling with Different Colors */
.btn-template {
    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
    border: none;
    color: #212529;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.btn-template:hover {
    background: linear-gradient(135deg, #e0a800 0%, #d39e00 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
    color: #212529;
}

.btn-import {
    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
    border: none;
    color: white;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.btn-import:hover {
    background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
    color: white;
}

.btn-add-new {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    border: none;
    color: white;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.btn-add-new:hover {
    background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    color: white;
}

/* Card Content Styling with Soft Colors */
.rencana-card {
    border: none;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
}

.rencana-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Status Badge Colors - Soft and Contrasting */
.badge-status-aktif {
    background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    color: #155724;
    border: 1px solid #c3e6cb;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 20px;
}

.badge-status-draft {
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    color: #856404;
    border: 1px solid #ffeaa7;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 20px;
}

.badge-status-selesai {
    background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
    color: #0c5460;
    border: 1px solid #bee5eb;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 20px;
}

/* Action Buttons in Cards - Neatly Arranged */
.card-actions {
    display: flex;
    gap: 4px;
    justify-content: center;
    flex-wrap: wrap;
}

.card-actions .btn {
    flex: 1;
    min-width: 60px;
    padding: 6px 8px;
    font-size: 0.8rem;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-view {
    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
    border: none;
    color: white;
}

.btn-view:hover {
    background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
    transform: translateY(-1px);
    color: white;
}

.btn-edit {
    background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%);
    border: none;
    color: white;
}

.btn-edit:hover {
    background: linear-gradient(135deg, #e55a00 0%, #dc5200 100%);
    transform: translateY(-1px);
    color: white;
}

.btn-delete {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    border: none;
    color: white;
}

.btn-delete:hover {
    background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
    transform: translateY(-1px);
    color: white;
}

/* Form Section - Hidden by default */
.form-section {
    display: none;
}

.form-section.show {
    display: block;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Card Grid Layout */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .action-buttons-container {
        justify-content: center;
        gap: 6px;
    }
    
    .cards-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .card-actions {
        flex-direction: column;
        gap: 6px;
    }
    
    .card-actions .btn {
        flex: none;
        width: 100%;
    }
}

@media (max-width: 576px) {
    .action-buttons-container {
        flex-direction: column;
        align-items: stretch;
    }
    
    .action-buttons-container .btn {
        width: 100%;
        margin-bottom: 0.5rem;
    }
}

/* Animation for smooth interactions */
.rencana-card,
.btn,
.badge-status-aktif,
.badge-status-draft,
.badge-status-selesai {
    transition: all 0.2s ease;
}

/* Focus states for accessibility */
.btn:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

/* Print styles */
@media print {
    .action-buttons-container,
    .card-actions {
        display: none !important;
    }
    
    .rencana-card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #dee2e6;
    }
}
`;

// Write the improved CSS
try {
    fs.writeFileSync(cssFilePath, improvedCSS);
    console.log('✅ Enhanced CSS file created successfully');
} catch (error) {
    console.error('❌ Error writing CSS file:', error);
}

// Create a patch script for the JavaScript file
const jsPatch = `
// Apply improvements to the render function
function applyRencanaStrategisImprovements() {
    console.log('🔧 Applying Rencana Strategis improvements...');
    
    // Override the render function if it exists
    if (window.RencanaStrategisModule && window.RencanaStrategisModule.render) {
        const originalRender = window.RencanaStrategisModule.render;
        
        window.RencanaStrategisModule.render = function() {
            console.log('🎨 Rendering Improved Rencana Strategis...');
            
            const container = findContainer();
            if (!container) {
                console.error('❌ Container not found!');
                return;
            }
            
            // Clear any existing content first
            container.innerHTML = '';
            
            // Show improved interface without header text and toggle view
            const content = \`
              <!-- Action Buttons - Right Aligned -->
              <div class="action-buttons-container">
                <button class="btn btn-template btn-sm" id="rs-download-template">
                  <i class="fas fa-download"></i> Template
                </button>
                <button class="btn btn-import btn-sm" id="rs-import-btn">
                  <i class="fas fa-upload"></i> Import
                </button>
                <button class="btn btn-add-new btn-sm" id="rs-add-new">
                  <i class="fas fa-plus"></i> Tambah Baru
                </button>
              </div>

              <!-- Form Section - Hidden by default, shown only when adding/editing -->
              <div class="card form-section" id="form-section">
                <div class="card-header bg-gradient-primary">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 class="card-title mb-1">
                        <i class="fas fa-\${state.currentId ? 'edit' : 'plus-circle'} me-2"></i>
                        \${state.currentId ? 'Edit' : 'Tambah'} Rencana Strategis
                      </h4>
                      <p class="mb-0 opacity-75">Lengkapi form di bawah untuk \${state.currentId ? 'mengubah' : 'menambahkan'} rencana strategis</p>
                    </div>
                    <button type="button" class="btn btn-light btn-sm" id="rs-close-form">
                      <i class="fas fa-times"></i> Tutup
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  \${renderForm()}
                </div>
              </div>
              
              <!-- Data Cards Section -->
              <div class="cards-grid" id="cards-section">
                \${renderDataCards()}
              </div>
              
              <!-- Hidden file input -->
              <input type="file" id="rs-import-input" hidden accept=".xlsx,.xls">
            \`;
            
            // Set content with proper error handling
            try {
                container.innerHTML = content;
                bindEvents();
                
                console.log('✅ Improved Rencana Strategis rendered successfully');
            } catch (error) {
                console.error('❌ Error rendering content:', error);
                container.innerHTML = \`
                    <div class="alert alert-danger">
                      <h5><i class="fas fa-exclamation-triangle"></i> Error Rendering</h5>
                      <p>Terjadi kesalahan saat merender halaman: \${error.message}</p>
                      <button onclick="location.reload()" class="btn btn-primary">Refresh Halaman</button>
                    </div>
                \`;
            }
        };
        
        // Add renderDataCards function if it doesn't exist
        if (!window.RencanaStrategisModule.renderDataCards) {
            window.RencanaStrategisModule.renderDataCards = function() {
                if (!state.data || state.data.length === 0) {
                    return \`
                        <div class="col-12">
                          <div class="card text-center py-5">
                            <div class="card-body">
                              <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                              <h4 class="text-muted">Belum ada data rencana strategis</h4>
                              <p class="text-muted mb-4">Klik tombol "Tambah Baru" untuk menambahkan rencana strategis pertama</p>
                              <button class="btn btn-add-new" id="rs-add-first">
                                <i class="fas fa-plus"></i> Tambah Rencana Strategis
                              </button>
                            </div>
                          </div>
                        </div>
                    \`;
                }
                
                return state.data.map(item => {
                    const statusClass = item.status === 'Aktif' ? 'aktif' : 
                                       item.status === 'Draft' ? 'draft' : 'selesai';
                    const periode = item.periode_mulai && item.periode_selesai ? 
                        \`\${formatDate(item.periode_mulai)} - \${formatDate(item.periode_selesai)}\` : 'Periode belum ditentukan';
                    
                    return \`
                        <div class="rencana-card">
                          <div class="card-header bg-gradient-\${statusClass === 'aktif' ? 'success' : statusClass === 'draft' ? 'warning' : 'info'}">
                            <div class="d-flex justify-content-between align-items-start">
                              <div class="flex-grow-1">
                                <h6 class="card-title mb-1 fw-bold">\${item.kode}</h6>
                                <span class="badge badge-status-\${statusClass}">\${item.status || 'Draft'}</span>
                              </div>
                            </div>
                          </div>
                          <div class="card-body">
                            <h6 class="card-title text-dark mb-2">\${item.nama_rencana || 'Nama rencana belum diisi'}</h6>
                            <p class="card-text text-muted small mb-3">\${truncateText(item.deskripsi || 'Deskripsi belum diisi', 120)}</p>
                            
                            <div class="mb-3">
                              <small class="text-muted d-block mb-1"><i class="fas fa-calendar me-1"></i>Periode:</small>
                              <small class="text-dark">\${periode}</small>
                            </div>
                            
                            \${item.target ? \`
                              <div class="mb-3">
                                <small class="text-muted d-block mb-1"><i class="fas fa-bullseye me-1"></i>Target:</small>
                                <small class="text-dark">\${truncateText(item.target, 80)}</small>
                              </div>
                            \` : ''}
                          </div>
                          <div class="card-footer bg-transparent border-0 pt-0">
                            <div class="card-actions">
                              <button class="btn btn-view" onclick="viewDetail('\${item.id}')" title="Lihat Detail">
                                <i class="fas fa-eye"></i> Detail
                              </button>
                              <button class="btn btn-edit" onclick="startEdit('\${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i> Edit
                              </button>
                              <button class="btn btn-delete" onclick="deleteRencana('\${item.id}')" title="Hapus">
                                <i class="fas fa-trash"></i> Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                    \`;
                }).join('');
            };
        }
        
        console.log('✅ Rencana Strategis improvements applied successfully');
    } else {
        console.warn('⚠️ RencanaStrategisModule not found, improvements will be applied when module loads');
    }
}

// Apply improvements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRencanaStrategisImprovements);
} else {
    applyRencanaStrategisImprovements();
}

// Also apply when the module is loaded
setTimeout(applyRencanaStrategisImprovements, 1000);
`;

// Write the patch script
const patchFilePath = path.join(__dirname, 'public/js/rencana-strategis-improvements.js');
try {
    fs.writeFileSync(patchFilePath, jsPatch);
    console.log('✅ JavaScript improvements patch created successfully');
} catch (error) {
    console.error('❌ Error writing JavaScript patch:', error);
}

console.log('🎉 All improvements applied successfully!');
console.log('📝 Files created:');
console.log('   - public/css/rencana-strategis-enhanced.css (updated)');
console.log('   - public/js/rencana-strategis-improvements.js (new)');
console.log('');
console.log('📋 To use the improvements:');
console.log('   1. Include the enhanced CSS file in your HTML');
console.log('   2. Include the improvements JavaScript file after the main module');
console.log('   3. The improvements will be applied automatically');