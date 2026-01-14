# Penghapusan Tampilan "Pilih Rencana Strategis" dari Semua Halaman

## Masalah
Tampilan "Pilih Rencana Strategis" dengan list RS-2025-xxx muncul di semua halaman (termasuk Analisis SWOT, Dashboard, dll), padahal seharusnya tidak muncul di halaman-halaman tersebut.

## Solusi yang Diterapkan

### 1. File CSS Baru: `public/css/hide-rs-selection-list.css`
- CSS rules untuk menyembunyikan RS selection list secara langsung
- Bekerja sebelum JavaScript dijalankan untuk mencegah flash of unwanted content

### 2. Update `public/js/prevent-global-rs-dropdown.js`
- Sistem deteksi yang lebih komprehensif untuk RS selection list
- Pattern matching untuk berbagai format RS codes (RS-2025-xxx, RS-2024-xxx, dll)
- MutationObserver untuk mendeteksi dan menghapus elemen yang ditambahkan secara dinamis
- Periodic cleanup setiap 2 detik selama 10 detik pertama

### 3. Update `public/js/force-rencana-strategis-dashboard.js`
- Fungsi `removeRSSelectionFromOtherPages()` untuk menghapus RS selection dari halaman non-RS
- Periodic cleanup setiap 2 detik
- Event listeners untuk hashchange dan popstate

### 4. Update `public/js/startup-script.js`
- Fungsi `cleanupRSSelectionList()` yang dijalankan saat startup
- Cleanup dilakukan sebelum dan sesudah page initialization
- Periodic cleanup setiap 3 detik

### 5. Update `public/js/navigation.js`
- Fungsi `cleanupRSSelectionList()` global
- Cleanup dilakukan sebelum navigasi dimulai
- Cleanup dilakukan setelah navigasi selesai (100ms dan 500ms delay)
- Final cleanup di blok finally

### 6. Update `public/index.html`
- Menambahkan link ke CSS baru `hide-rs-selection-list.css`

## Cara Kerja

1. **CSS Layer**: Menyembunyikan elemen RS selection list secara langsung via CSS
2. **Startup Layer**: Cleanup saat aplikasi dimulai
3. **Navigation Layer**: Cleanup sebelum dan sesudah setiap navigasi
4. **Observer Layer**: MutationObserver untuk mendeteksi elemen baru
5. **Periodic Layer**: Cleanup berkala untuk menangkap elemen yang lolos

## Testing

Untuk menguji perbaikan:
1. Restart server: `npm start`
2. Buka aplikasi di browser
3. Navigasi ke berbagai halaman (Dashboard, Analisis SWOT, Sasaran Strategi, dll)
4. Verifikasi bahwa tampilan "Pilih Rencana Strategis" dengan list RS-2025-xxx TIDAK muncul di halaman manapun kecuali halaman Rencana Strategis

## Catatan
- Dropdown "Pilih Rencana Strategis" di dalam form (seperti di Sasaran Strategi, IKU) tetap berfungsi normal
- Hanya tampilan selection list dengan multiple RS codes yang dihapus
