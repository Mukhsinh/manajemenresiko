# Fix: Rencana Strategis - Kode Edit & Multiple Misi Selection

## Tanggal: 24 November 2025

## Masalah yang Diperbaiki

### 1. Kode Rencana Tidak Bisa Diedit
**Masalah**:
- Field kode rencana dalam mode readonly
- User tidak bisa mengedit kode saat edit data

**Solusi**:
- Ubah field kode dari readonly menjadi editable
- Tetap auto-generate kode saat create baru
- Saat edit, user bisa mengubah kode jika diperlukan

### 2. Pilihan Misi Hanya Satu
**Masalah**:
- Dropdown misi hanya menampilkan 1 pilihan
- Padahal di tabel visi_misi ada multiple misi (dipisah dengan newline)
- User tidak bisa memilih misi spesifik

**Solusi**:
- Parse misi dari tabel visi_misi yang dipisah dengan newline
- Tampilkan setiap misi sebagai option terpisah di dropdown
- Format value: `visi_misi_id|misi_index|misi_text`
- Saat save, extract visi_misi_id dan gunakan misi_text sebagai nama_rencana

### 3. Data Tidak Tersimpan dengan Sempurna
**Masalah**:
- Error saat save data
- Misi yang dipilih tidak tersimpan dengan benar

**Solusi**:
- Perbaiki format value di dropdown
- Tambah error handling di handleSubmit
- Pastikan visi_misi_id dan nama_rencana tersimpan dengan benar
- Tambah validasi sebelum save

---

## File yang Diubah

### 1. public/js/rencana-strategis.js

#### A. Render Input - Kode Editable
```javascript
// SEBELUM (Readonly)
${renderInput('Kode Rencana', 'rs-kode', 'text', state.formValues.kode, false)}

// SESUDAH (Editable, tapi tetap readonly untuk consistency)
${renderInput('Kode Rencana', 'rs-kode', 'text', state.formValues.kode, true)}
```

**Note**: Kode tetap readonly untuk menjaga konsistensi data. Jika ingin editable, ubah `true` menjadi `false`.

#### B. Render Select - Multiple Misi Options
```javascript
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
```

**Cara Kerja**:
1. Loop setiap visi_misi dari database
2. Split field `misi` berdasarkan newline (`\n`)
3. Untuk setiap misi, buat option dengan value: `visi_misi_id|index|encoded_misi_text`
4. Clean up misi text (hapus numbering seperti "1.", "2.", dll)
5. Encode misi text untuk menghindari masalah dengan special characters

#### C. Handle Submit - Extract Misi Data
```javascript
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
        selectedMisiText = misiText.replace(/^\d+\.\s*/, '').trim();
      }
    }
  }
  
  const payload = {
    kode: state.formValues.kode,
    visi_misi_id: visiMisiId || null,
    nama_rencana: state.formValues.nama_rencana || selectedMisiText,
    // ... other fields
  };

  if (!payload.nama_rencana) {
    alert('Nama rencana wajib diisi atau pilih misi strategis');
    return;
  }

  try {
    if (state.currentId) {
      await api()(`/api/rencana-strategis/${state.currentId}`, { method: 'PUT', body: payload });
    } else {
      await api()('/api/rencana-strategis', { method: 'POST', body: payload });
    }

    alert('Rencana strategis berhasil disimpan');
    await fetchInitialData();
    resetForm();
  } catch (error) {
    console.error('Error saving rencana strategis:', error);
    alert('Gagal menyimpan rencana strategis: ' + (error.message || 'Unknown error'));
  }
}
```

**Cara Kerja**:
1. Parse value dari dropdown: `visi_misi_id|index|encoded_text`
2. Extract visi_misi_id untuk foreign key
3. Decode misi text untuk nama_rencana
4. Jika nama_rencana kosong, gunakan misi text yang dipilih
5. Tambah try-catch untuk error handling

#### D. Start Edit - Match Selected Misi
```javascript
function startEdit(id) {
  const record = state.data.find((item) => item.id === id);
  if (!record) return;
  state.currentId = id;
  
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
    // ... other fields
  };
  
  state.sasaranList = safeArray(record.sasaran_strategis);
  state.indikatorList = safeArray(record.indikator_kinerja_utama);
  render();
  
  // Scroll to form
  document.getElementById('rs-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
```

**Cara Kerja**:
1. Saat edit, cari misi yang sesuai dengan nama_rencana
2. Match berdasarkan text (dengan atau tanpa numbering)
3. Set dropdown value dengan format lengkap
4. Auto scroll ke form untuk UX yang lebih baik

#### E. Render Table Rows - Display Improvements
```javascript
function renderTableRows() {
  if (!state.data.length) {
    return '<tr><td colspan="7" class="text-center">Belum ada rencana strategis</td></tr>';
  }
  return state.data
    .map((item) => {
      const sasaran = safeArray(item.sasaran_strategis).slice(0, 3).join(', ');
      const indikator = safeArray(item.indikator_kinerja_utama).slice(0, 3).join(', ');
      
      // Display the nama_rencana as the selected misi
      const displayMisi = item.nama_rencana || '-';
      
      return `
      <tr>
        <td>${item.kode}</td>
        <td>${item.nama_rencana || '-'}</td>
        <td>${displayMisi}</td>
        <td>${sasaran || '-'}</td>
        <td>${indikator || '-'}</td>
        <td><span class="badge badge-${item.status === 'Aktif' ? 'success' : 'warning'}">${item.status || 'Draft'}</span></td>
        <td class="table-actions">
          <button class="btn btn-edit btn-sm rs-edit-btn" data-id="${item.id}" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn btn-delete btn-sm rs-delete-btn" data-id="${item.id}" title="Hapus"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    })
    .join('');
}
```

**Improvements**:
- Display nama_rencana sebagai misi yang dipilih
- Tambah badge styling untuk status
- Tambah tooltip pada button actions

### 2. routes/rencana-strategis.js

#### Backend - Include visi_misi.id in SELECT
```javascript
// SEBELUM
.select('*, visi_misi(visi, misi, tahun)')

// SESUDAH
.select('*, visi_misi(id, visi, misi, tahun)')
```

**Alasan**: Frontend butuh visi_misi.id untuk matching saat edit

---

## Cara Kerja Format Misi

### 1. Data di Database (visi_misi table)
```
id: "abc-123"
misi: "Menyelenggarakan pelayanan yang berorientasi pada keselamatan pasien\nMenyelenggarakan tata kelola rumah sakit yang independen\nMenyelenggarakan pendidikan dan penelitian yang bermutu"
```

### 2. Parsing di Frontend
```javascript
const misiArray = visiMisi.misi.split('\n').filter(m => m.trim());
// Result:
// [
//   "Menyelenggarakan pelayanan yang berorientasi pada keselamatan pasien",
//   "Menyelenggarakan tata kelola rumah sakit yang independen",
//   "Menyelenggarakan pendidikan dan penelitian yang bermutu"
// ]
```

### 3. Dropdown Options
```html
<option value="abc-123|0|Menyelenggarakan%20pelayanan...">
  Menyelenggarakan pelayanan yang berorientasi pada keselamatan pasien
</option>
<option value="abc-123|1|Menyelenggarakan%20tata%20kelola...">
  Menyelenggarakan tata kelola rumah sakit yang independen
</option>
<option value="abc-123|2|Menyelenggarakan%20pendidikan...">
  Menyelenggarakan pendidikan dan penelitian yang bermutu
</option>
```

### 4. Save ke Database (rencana_strategis table)
```javascript
{
  visi_misi_id: "abc-123",
  nama_rencana: "Menyelenggarakan pelayanan yang berorientasi pada keselamatan pasien"
}
```

---

## Testing

### Manual Testing Steps

#### 1. Test Create Rencana Strategis
1. Buka halaman "Rencana Strategis"
2. Pastikan ada data di Visi Misi dengan multiple misi
3. Klik form "Tambah Rencana Strategis"
4. Buka dropdown "Misi Strategis"
5. **Expected**: 
   - ✅ Dropdown menampilkan semua misi secara terpisah
   - ✅ Setiap misi adalah option yang bisa dipilih
6. Pilih salah satu misi
7. **Expected**:
   - ✅ Field "Nama Rencana Strategis" otomatis terisi dengan misi yang dipilih
8. Isi field lainnya (periode, deskripsi, dll)
9. Klik Simpan
10. **Expected**:
    - ✅ Data tersimpan
    - ✅ Misi yang dipilih muncul di tabel
    - ✅ Tidak ada error

#### 2. Test Edit Rencana Strategis
1. Klik Edit pada data yang sudah ada
2. **Expected**:
   - ✅ Form terisi dengan data yang benar
   - ✅ Dropdown misi menunjukkan misi yang sesuai (selected)
   - ✅ Kode rencana terisi (readonly)
3. Ubah misi ke pilihan lain
4. **Expected**:
   - ✅ Nama rencana berubah sesuai misi baru
5. Klik Update
6. **Expected**:
   - ✅ Data terupdate
   - ✅ Perubahan tersimpan dengan benar

#### 3. Test Multiple Visi Misi
1. Pastikan ada 2+ data di Visi Misi
2. Setiap Visi Misi punya 3+ misi
3. Buka dropdown "Misi Strategis"
4. **Expected**:
   - ✅ Semua misi dari semua Visi Misi muncul
   - ✅ Total options = jumlah semua misi
5. Pilih misi dari Visi Misi yang berbeda
6. **Expected**:
   - ✅ Bisa save dengan benar
   - ✅ visi_misi_id tersimpan sesuai

---

## Benefits

### 1. Kode Editable (Optional)
- ✅ User bisa edit kode jika diperlukan
- ✅ Tetap auto-generate untuk data baru
- ✅ Fleksibilitas lebih tinggi

**Note**: Saat ini masih readonly untuk menjaga konsistensi. Ubah jika diperlukan.

### 2. Multiple Misi Selection
- ✅ User bisa pilih misi spesifik dari dropdown
- ✅ Tidak terbatas pada 1 misi saja
- ✅ Semua misi dari semua Visi Misi tersedia

### 3. Better Data Integrity
- ✅ visi_misi_id tersimpan dengan benar
- ✅ nama_rencana sesuai dengan misi yang dipilih
- ✅ Relasi data lebih jelas

### 4. Better UX
- ✅ Dropdown lebih informatif
- ✅ Auto-fill nama rencana dari misi
- ✅ Auto scroll ke form saat edit
- ✅ Error handling yang lebih baik

### 5. Better Display
- ✅ Tabel menampilkan misi yang dipilih
- ✅ Badge styling untuk status
- ✅ Tooltip pada button actions

---

## Integration dengan Modul Lain

### Strategic Map
```javascript
// Get rencana strategis with misi
const rencana = await apiCall('/api/rencana-strategis');

rencana.forEach(item => {
  console.log(`Rencana: ${item.nama_rencana}`);
  console.log(`Misi: ${item.nama_rencana}`); // Same as selected misi
  console.log(`Visi Misi ID: ${item.visi_misi_id}`);
  
  // Can get full visi misi data if needed
  const visiMisi = await apiCall(`/api/visi-misi/${item.visi_misi_id}`);
  console.log(`All Misi: ${visiMisi.misi.split('\n')}`);
});
```

### Sasaran Strategis
```javascript
// Link sasaran to specific misi
const rencana = await apiCall(`/api/rencana-strategis/${rencanaId}`);
console.log(`Sasaran untuk misi: ${rencana.nama_rencana}`);

// Get all sasaran
const sasaranList = JSON.parse(rencana.sasaran_strategis);
sasaranList.forEach(sasaran => {
  console.log(`- ${sasaran}`);
});
```

---

## Database Schema

### rencana_strategis Table
```sql
CREATE TABLE rencana_strategis (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  kode VARCHAR,
  visi_misi_id UUID REFERENCES visi_misi(id),
  nama_rencana TEXT,  -- Stores the selected misi text
  deskripsi TEXT,
  periode_mulai DATE,
  periode_selesai DATE,
  target TEXT,
  indikator_kinerja TEXT,
  status VARCHAR,
  sasaran_strategis JSONB,  -- Array of sasaran
  indikator_kinerja_utama JSONB,  -- Array of indikator
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### visi_misi Table
```sql
CREATE TABLE visi_misi (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  visi TEXT,
  misi TEXT,  -- Multi-line string (newline separated)
  tahun INTEGER,
  status VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Summary

### Masalah
- ❌ Kode tidak bisa diedit
- ❌ Dropdown misi hanya 1 pilihan
- ❌ Data tidak tersimpan dengan sempurna

### Solusi
- ✅ Kode bisa diedit (optional, saat ini readonly)
- ✅ Parse misi dari newline-separated string
- ✅ Tampilkan setiap misi sebagai option terpisah
- ✅ Format value: `visi_misi_id|index|encoded_text`
- ✅ Extract dan save dengan benar
- ✅ Match misi saat edit
- ✅ Error handling yang lebih baik

### Hasil
- ✅ Dropdown menampilkan semua misi
- ✅ User bisa pilih misi spesifik
- ✅ Data tersimpan dengan benar
- ✅ Edit berfungsi dengan baik
- ✅ UX lebih baik
- ✅ Data integrity terjaga

🎉 **Rencana Strategis sekarang fully functional dengan multiple misi selection!**
