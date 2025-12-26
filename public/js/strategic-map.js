// Strategic Map Module
const StrategicMapModule = (() => {
  const state = {
    data: [],
    rencanaStrategis: [],
    filters: {
      rencana_strategis_id: ''
    }
  };

  const api = () => (window.app ? window.app.apiCall : window.apiCall);

  async function load() {
    await fetchInitialData();
    render();
  }

  async function fetchInitialData() {
    try {
      const map = await api()('/api/strategic-map');
      state.data = map || [];
    } catch (error) {
      console.error('Error fetching data:', error);
      state.data = [];
    }
  }

  /**
   * Renders the Strategic Map page with enhanced styling
   * @returns {void}
   */
  function render() {
    /** @type {HTMLElement | null} */
    const container = document.getElementById('strategic-map-content');
    if (!container) return;

    // Add enhanced CSS styling
    const styleId = 'strategic-map-enhanced-styles';
    if (!document.getElementById(styleId)) {
      /** @type {HTMLStyleElement} */
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Enhanced Strategic Map Styles */
        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem 0;
          margin-bottom: 2rem;
          border-radius: 12px;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .table-container {
          overflow-x: auto;
          max-width: 100%;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .strategic-map-card {
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: none;
        }
        
        .badge-status {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .btn-icon {
          padding: 6px 8px;
          margin: 0 2px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-edit {
          background-color: #17a2b8;
          color: white;
        }
        
        .btn-delete {
          background-color: #dc3545;
          color: white;
        }
        
        .btn-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Strategic Map</h3>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <button class="btn btn-success" onclick="StrategicMapModule.generate()">
              <i class="fas fa-sync"></i> Generate Map Otomatis
            </button>
            <div class="dropdown" style="position: relative;">
              <button class="btn btn-primary dropdown-toggle" onclick="StrategicMapModule.toggleDownloadMenu()" ${state.data.length === 0 ? 'disabled' : ''}>
                <i class="fas fa-download"></i> Unduh Map
              </button>
              <div class="dropdown-menu" id="download-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 180px;">
                <a class="dropdown-item" href="#" onclick="StrategicMapModule.downloadExcel()" style="display: block; padding: 8px 16px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                  <i class="fas fa-file-excel" style="color: #28a745; margin-right: 8px;"></i> Download Excel
                </a>
                <a class="dropdown-item" href="#" onclick="StrategicMapModule.downloadImage()" style="display: block; padding: 8px 16px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                  <i class="fas fa-image" style="color: #007bff; margin-right: 8px;"></i> Download Gambar
                </a>
                <a class="dropdown-item" href="#" onclick="StrategicMapModule.downloadPDF()" style="display: block; padding: 8px 16px; text-decoration: none; color: #333;">
                  <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 8px;"></i> Download PDF
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div id="strategic-map-visualization" style="position: relative; min-height: 600px; border: 1px solid #dee2e6; border-radius: 8px; padding: 2rem; background: #f8f9fa;">
            ${renderVisualization()}
          </div>
          <div class="table-container" style="margin-top: 2rem;">
            <table class="table">
              <thead>
                <tr>
                  <th>Perspektif</th>
                  <th>Sasaran Strategi</th>
                  <th>Posisi X</th>
                  <th>Posisi Y</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${state.data.length === 0 ? '<tr><td colspan="5" class="text-center">Tidak ada data. Klik "Generate Map Otomatis" untuk membuat strategic map dari sasaran strategi yang tersedia.</td></tr>' : ''}
                ${(() => {
                  const seenIds = new Set();
                  return state.data.filter(item => {
                    if (seenIds.has(item.sasaran_strategi_id)) {
                      return false; // Skip duplicates
                    }
                    seenIds.add(item.sasaran_strategi_id);
                    return true;
                  }).map(item => `
                  <tr>
                    <td><span class="badge-status badge-${getPerspektifColor(item.perspektif)}">${item.perspektif}</span></td>
                    <td>${item.sasaran_strategi?.sasaran || '-'}</td>
                    <td>${item.posisi_x}</td>
                    <td>${item.posisi_y}</td>
                    <td>
                      <button class="btn btn-edit btn-sm" onclick="StrategicMapModule.edit('${item.id}')">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-delete btn-sm" onclick="StrategicMapModule.delete('${item.id}')">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('');
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderVisualization() {
    if (state.data.length === 0) {
      return '<div style="text-align: center; padding: 3rem; color: #6c757d;"><i class="fas fa-project-diagram" style="font-size: 3rem; margin-bottom: 1rem;"></i><p>Pilih rencana strategis dan generate strategic map</p></div>';
    }

    const grouped = groupByPerspektif(state.data);
    const perspektifLabels = {
      'ES': 'Eksternal Stakeholder',
      'IBP': 'Internal Business Process',
      'LG': 'Learning & Growth',
      'Fin': 'Financial',
      'Eksternal Stakeholder': 'Eksternal Stakeholder',
      'Internal Business Process': 'Internal Business Process',
      'Learning & Growth': 'Learning & Growth',
      'Financial': 'Financial'
    };
    const perspektifOrder = ['Eksternal Stakeholder', 'Internal Business Process', 'Learning & Growth', 'Financial'];
    
    return perspektifOrder.map((perspektif, idx) => {
      // Check both short and full names
      const shortKey = Object.keys(perspektifLabels).find(key => perspektifLabels[key] === perspektif);
      const items = grouped[perspektif] || grouped[shortKey] || [];
      if (items.length === 0) return '';
      
      const label = perspektifLabels[perspektif] || perspektif;
      
      return `
        <div class="perspektif-group" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 8px; border-left: 4px solid ${getPerspektifColorHex(perspektif)}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h4 style="margin-bottom: 1rem; color: ${getPerspektifColorHex(perspektif)}; font-weight: 600;">
            <i class="fas fa-layer-group"></i> ${label}
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
            ${items.map(item => `
              <div class="sasaran-node" 
                   style="padding: 1rem; background: ${item.warna || getPerspektifColorHex(perspektif)}; color: white; border-radius: 8px; cursor: move; transition: transform 0.2s, box-shadow 0.2s;"
                   onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
                   draggable="true"
                   data-id="${item.id}"
                   ondragstart="StrategicMapModule.handleDragStart(event)"
                   ondrop="StrategicMapModule.handleDrop(event)"
                   ondragover="event.preventDefault()">
                <div style="font-size: 0.9rem; line-height: 1.4;">
                  ${item.sasaran_strategi?.sasaran || 'Sasaran Strategi'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function groupByPerspektif(data) {
    const groups = {};
    const seenIds = new Set(); // Track seen IDs to prevent duplicates in frontend
    
    data.forEach(item => {
      // Skip duplicates based on sasaran_strategi_id
      if (seenIds.has(item.sasaran_strategi_id)) {
        console.warn('⚠️ Skipping duplicate sasaran_strategi_id in frontend:', item.sasaran_strategi_id);
        return;
      }
      seenIds.add(item.sasaran_strategi_id);
      
      // Use the perspektif as is (full name from database)
      const perspektifKey = item.perspektif;
      
      if (!groups[perspektifKey]) {
        groups[perspektifKey] = [];
      }
      groups[perspektifKey].push(item);
    });
    return groups;
  }

  function getPerspektifColor(perspektif) {
    const colorMap = {
      'Eksternal Stakeholder': 'normal',
      'Internal Business Process': 'aman',
      'Learning & Growth': 'hati-hati',
      'Financial': 'kritis',
      'ES': 'normal',
      'IBP': 'aman',
      'LG': 'hati-hati',
      'Fin': 'kritis'
    };
    return colorMap[perspektif] || 'secondary';
  }

  function getPerspektifColorHex(perspektif) {
    const colorMap = {
      'Eksternal Stakeholder': '#3498db',
      'Internal Business Process': '#27ae60',
      'Learning & Growth': '#f39c12',
      'Financial': '#e74c3c',
      'ES': '#3498db',
      'IBP': '#27ae60',
      'LG': '#f39c12',
      'Fin': '#e74c3c'
    };
    return colorMap[perspektif] || '#95a5a6';
  }

  async function generate() {
    if (!confirm('Generate strategic map dari semua sasaran strategi?\nData yang sudah ada akan diganti dengan data terbaru.')) return;

    try {
      // Show loading state
      let button = null;
      if (window.event && window.event.target) {
        button = window.event.target;
      } else {
        // Fallback: find the generate button
        button = document.querySelector('button[onclick*="generate"]');
      }
      
      let originalText = '';
      if (button) {
        originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        button.disabled = true;
      }

      console.log('🗺️ Generating strategic map for all sasaran strategis');

      const result = await api()('/api/strategic-map/generate-all', {
        method: 'POST'
      });
      
      console.log('✅ Generate response:', result);
      
      await load();
      
      // Restore button
      if (button) {
        button.innerHTML = originalText;
        button.disabled = false;
      }
      
      if (result.generated > 0) {
        alert(`Strategic map berhasil digenerate!\nTotal: ${result.generated} sasaran strategi\n\nDistribusi per perspektif:\n${Object.entries(result.summary?.perspektif_distribution || {}).map(([k, v]) => `- ${k}: ${v} sasaran`).join('\n')}`);
      } else {
        alert('Tidak ada sasaran strategi untuk digenerate.\nSilakan tambahkan sasaran strategi terlebih dahulu.');
      }
    } catch (error) {
      // Restore button on error
      if (button) {
        button.innerHTML = originalText || '<i class="fas fa-sync"></i> Generate Map';
        button.disabled = false;
      }
      
      console.error('❌ Generate error:', error);
      alert('Error: ' + (error.message || 'Terjadi kesalahan saat generate strategic map'));
    }
  }

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
  }

  function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    // Update position logic can be added here
  }

  function edit(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Posisi Strategic Map</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <form onsubmit="StrategicMapModule.savePosition(event, '${id}')">
          <div class="form-group">
            <label class="form-label">Posisi X</label>
            <input type="number" class="form-control" id="sm-x" value="${item.posisi_x}" step="1">
          </div>
          <div class="form-group">
            <label class="form-label">Posisi Y</label>
            <input type="number" class="form-control" id="sm-y" value="${item.posisi_y}" step="1">
          </div>
          <div class="form-group">
            <label class="form-label">Warna</label>
            <input type="color" class="form-control" id="sm-warna" value="${item.warna || '#3498db'}">
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async function savePosition(e, id) {
    e.preventDefault();
    try {
      const data = {
        posisi_x: parseFloat(document.getElementById('sm-x').value),
        posisi_y: parseFloat(document.getElementById('sm-y').value),
        warna: document.getElementById('sm-warna').value
      };

      await api()(`/api/strategic-map/${id}`, { method: 'PUT', body: data });
      document.querySelector('.modal').remove();
      await load();
      alert('Posisi berhasil diupdate');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await api()(`/api/strategic-map/${id}`, { method: 'DELETE' });
      await load();
      alert('Data berhasil dihapus');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  function toggleDownloadMenu() {
    const menu = document.getElementById('download-menu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    const menu = document.getElementById('download-menu');
    const button = event.target.closest('.dropdown');
    if (menu && !button) {
      menu.style.display = 'none';
    }
  });

  async function downloadExcel() {
    try {
      const rencanaId = state.filters.rencana_strategis_id;
      const url = `/api/strategic-map/actions/export${rencanaId ? `?rencana_strategis_id=${rencanaId}` : ''}`;
      
      // Create a temporary link to download the file
      const token = localStorage.getItem('supabase.auth.token') || 
                   sessionStorage.getItem('supabase.auth.token') ||
                   (window.supabaseClient && window.supabaseClient.auth.session()?.access_token) || '';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `strategic-map-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toggleDownloadMenu();
      alert('File Excel berhasil diunduh');
    } catch (error) {
      console.error('Download Excel error:', error);
      alert('Error downloading Excel: ' + error.message);
    }
  }

  async function downloadImage() {
    try {
      const visualization = document.getElementById('strategic-map-visualization');
      if (!visualization) {
        alert('Visualization not found');
        return;
      }

      // Use html2canvas if available, otherwise fallback to simple method
      if (window.html2canvas) {
        const canvas = await html2canvas(visualization, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false
        });
        
        const link = document.createElement('a');
        link.download = `strategic-map-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else {
        // Fallback: show alert to use canvas download instead
        alert('Grafik tidak tersedia untuk diunduh. Silakan gunakan fitur download Excel atau PDF.');
      }
      
      toggleDownloadMenu();
    } catch (error) {
      console.error('Download Image error:', error);
      alert('Error downloading image: ' + error.message);
    }
  }

  async function downloadPDF() {
    try {
      // Use jsPDF if available
      if (window.jsPDF) {
        const { jsPDF } = window.jsPDF;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Strategic Map', 20, 30);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString('id-ID')}`, 20, 45);
        
        // Add rencana strategis info
        const selectedRencana = state.rencanaStrategis.find(r => r.id === state.filters.rencana_strategis_id);
        if (selectedRencana) {
          doc.text(`Rencana Strategis: ${selectedRencana.nama_rencana}`, 20, 60);
        }
        
        // Group data by perspektif
        const grouped = groupByPerspektif(state.data);
        const perspektifOrder = ['Eksternal Stakeholder', 'Internal Business Process', 'Learning & Growth', 'Financial'];
        
        let yPosition = 80;
        
        perspektifOrder.forEach(perspektif => {
          const items = grouped[perspektif] || [];
          if (items.length === 0) return;
          
          // Add perspektif header
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text(perspektif, 20, yPosition);
          yPosition += 10;
          
          // Add sasaran items
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          items.forEach(item => {
            const sasaran = item.sasaran_strategi?.sasaran || 'Sasaran Strategi';
            const wrappedText = doc.splitTextToSize(sasaran, 160);
            doc.text(wrappedText, 25, yPosition);
            yPosition += wrappedText.length * 5 + 5;
            
            // Check if we need a new page
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
          });
          
          yPosition += 10;
        });
        
        // Save the PDF
        doc.save(`strategic-map-${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        // Fallback: create simple text version
        let content = 'STRATEGIC MAP\n\n';
        content += `Generated: ${new Date().toLocaleDateString('id-ID')}\n\n`;
        
        const selectedRencana = state.rencanaStrategis.find(r => r.id === state.filters.rencana_strategis_id);
        if (selectedRencana) {
          content += `Rencana Strategis: ${selectedRencana.nama_rencana}\n\n`;
        }
        
        const grouped = groupByPerspektif(state.data);
        const perspektifOrder = ['Eksternal Stakeholder', 'Internal Business Process', 'Learning & Growth', 'Financial'];
        
        perspektifOrder.forEach(perspektif => {
          const items = grouped[perspektif] || [];
          if (items.length === 0) return;
          
          content += `${perspektif.toUpperCase()}\n`;
          content += '='.repeat(perspektif.length) + '\n';
          
          items.forEach((item, index) => {
            content += `${index + 1}. ${item.sasaran_strategi?.sasaran || 'Sasaran Strategi'}\n`;
          });
          
          content += '\n';
        });
        
        // Create and download text file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `strategic-map-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      toggleDownloadMenu();
      alert('File PDF berhasil diunduh');
    } catch (error) {
      console.error('Download PDF error:', error);
      alert('Error downloading PDF: ' + error.message);
    }
  }

  return {
    load,
    generate,
    handleDragStart,
    handleDrop,
    edit,
    savePosition,
    delete: deleteItem,
    toggleDownloadMenu,
    downloadExcel,
    downloadImage,
    downloadPDF
  };
})();

async function loadStrategicMap() {
  await StrategicMapModule.load();
}

window.strategicMapModule = StrategicMapModule;

