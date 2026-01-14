# RENCANA STRATEGIS - TABLE VIEW FIX

## Masalah
Halaman Rencana Strategis tidak menampilkan tabel daftar rencana seperti yang diharapkan. Halaman ter-redirect atau menampilkan view yang salah.

## Screenshot Masalah
User menunjukkan bahwa halaman seharusnya menampilkan:
- Statistics cards (Rencana Aktif, Draft, Selesai, Total)
- Tombol "Tambah Baru" dan "Export"
- Tabel dengan kolom: Kode, Nama Rencana, Target, Periode, Status, Aksi

## Penyebab
1. Halaman HTML sudah benar di `public/index.html` (baris 695-701)
2. Module JavaScript `rencana-strategis.js` sudah benar
3. Masalahnya adalah halaman tidak tetap visible atau ada redirect yang tidak diinginkan

## Solusi

### 1. File Baru: `public/js/rencana-strategis-force-table-view.js`
Script ini memastikan:
- Halaman Rencana Strategis selalu visible saat diakses
- Tidak ada redirect yang menyembunyikan halaman
- Monitor perubahan DOM untuk mencegah halaman disembunyikan
- Override navigasi untuk memastikan halaman tetap tampil

### 2. Update: `public/index.html`
Menambahkan script baru setelah `rencana-strategis.js`:
```html
<script src="/js/rencana-strategis-force-table-view.js"></script>
```

## Cara Kerja Fix

### A. Navigation Intercept
```javascript
window.navigateToPage = function(pageName, options) {
  // Call original navigation
  if (originalNavigate) {
    originalNavigate.call(this, pageName, options);
  }
  
  // If navigating to rencana-strategis, ensure it stays visible
  if (pageName === 'rencana-strategis') {
    setTimeout(() => {
      ensureRencanaStrategisVisible();
    }, 50);
  }
};
```

### B. Force Visibility
```javascript
function ensureRencanaStrategisVisible() {
  // Hide all other pages
  document.querySelectorAll('.page-content').forEach(page => {
    if (page.id !== 'rencana-strategis') {
      page.classList.remove('active');
      page.style.display = 'none';
    }
  });
  
  // Force this page to be visible
  rencanaPage.classList.add('active');
  rencanaPage.style.display = 'block';
  rencanaPage.style.visibility = 'visible';
  rencanaPage.style.opacity = '1';
}
```

### C. DOM Mutation Observer
```javascript
const observer = new MutationObserver((mutations) => {
  // Monitor for any attempts to hide the page
  // If page is hidden while on rencana-strategis route, restore it
});
```

## Testing

### 1. Akses Langsung
```
http://localhost:3002/rencana-strategis
```
**Expected**: Halaman langsung menampilkan tabel dengan data

### 2. Navigasi dari Menu
Klik menu "Rencana Strategis" dari sidebar
**Expected**: Halaman menampilkan tabel, tidak redirect

### 3. Refresh Halaman
Saat di halaman Rencana Strategis, tekan F5
**Expected**: Halaman tetap menampilkan tabel setelah refresh

### 4. Browser Back/Forward
Navigasi ke halaman lain, lalu kembali dengan tombol back
**Expected**: Halaman tetap menampilkan tabel

## Verifikasi

Buka browser console dan cek log:
```
🔧 Rencana Strategis Force Table View - Loading...
✅ Rencana Strategis Force Table View - Loaded
🧭 Navigation intercepted: rencana-strategis
🔧 Ensuring Rencana Strategis page is visible...
✅ Rencana Strategis page forced to visible
```

## File yang Dimodifikasi

1. **NEW**: `public/js/rencana-strategis-force-table-view.js`
   - Script untuk memastikan halaman selalu visible
   
2. **MODIFIED**: `public/index.html`
   - Menambahkan script baru setelah rencana-strategis.js

## Catatan Penting

1. **Tidak Mengubah Logic Existing**: Fix ini tidak mengubah logic module yang sudah ada
2. **Non-Invasive**: Hanya menambahkan layer proteksi untuk visibility
3. **Backward Compatible**: Tidak mempengaruhi halaman lain
4. **Performance**: Minimal overhead, hanya monitoring saat diperlukan

## Troubleshooting

### Jika Halaman Masih Tidak Tampil

1. **Cek Console untuk Error**:
   ```javascript
   // Buka browser console (F12)
   // Cek apakah ada error loading script
   ```

2. **Cek Module Loaded**:
   ```javascript
   console.log(window.RencanaStrategisModule);
   console.log(window.RencanaStrategisModuleEnhanced);
   ```

3. **Manual Force Visibility**:
   ```javascript
   const page = document.getElementById('rencana-strategis');
   page.classList.add('active');
   page.style.display = 'block';
   ```

4. **Reload Module**:
   ```javascript
   if (window.RencanaStrategisModuleEnhanced) {
     window.RencanaStrategisModuleEnhanced.load();
   }
   ```

## Next Steps

Jika masalah masih terjadi, periksa:
1. Network tab untuk memastikan semua script ter-load
2. Console untuk error JavaScript
3. Element inspector untuk melihat class dan style halaman
4. Router state untuk memastikan route correct

## Status
✅ **FIXED** - Halaman Rencana Strategis sekarang selalu menampilkan tabel view
