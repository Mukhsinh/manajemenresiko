# PERBAIKAN: Hapus "Pilih Rencana Strategis" dari Latar Belakang Semua Halaman

## Masalah
Tampilan "Pilih Rencana Strategis" dengan daftar RS-2025-xxx muncul di latar belakang semua halaman aplikasi, termasuk halaman Analisis SWOT.

## Penyebab Utama
1. **HTML Rusak di analisis-swot.js**: Ada `<input type="hidden">` yang diikuti dengan `<option>` tags tanpa `<select>` yang membungkusnya. Ini menyebabkan browser merender option tags sebagai teks biasa.

2. **Kurangnya proteksi untuk mencegah konten RS muncul di halaman lain**

## Perbaikan yang Dilakukan

### 1. Perbaikan HTML di analisis-swot.js
- Memperbaiki form tambah data: Mengganti `<input type="hidden">` dengan `<select>` yang benar dan disembunyikan dengan `style="display: none;"`
- Memperbaiki form edit data: Sama seperti di atas

### 2. Script Baru: remove-rs-from-all-pages.js
- Script agresif untuk menghapus konten RS dari semua halaman kecuali /rencana-strategis
- Mendeteksi pola RS seperti "Pilih Rencana Strategis", kode RS-2025-xxx, dan nama-nama rencana strategis
- Menggunakan MutationObserver untuk memantau perubahan DOM
- Pembersihan periodik setiap 3 detik

### 3. CSS Baru: hide-rs-everywhere.css
- CSS untuk menyembunyikan elemen RS di halaman yang salah
- Memastikan konten RS hanya tampil di halaman rencana-strategis

### 4. Update index.html
- Menambahkan script remove-rs-from-all-pages.js
- Menambahkan CSS hide-rs-everywhere.css

## File yang Dimodifikasi
1. `public/js/analisis-swot.js` - Perbaikan HTML form
2. `public/js/remove-rs-from-all-pages.js` - Script baru
3. `public/css/hide-rs-everywhere.css` - CSS baru
4. `public/index.html` - Menambahkan script dan CSS baru

## Cara Verifikasi
1. Restart server: `npm start`
2. Buka aplikasi di browser
3. Login dan navigasi ke halaman Analisis SWOT
4. Verifikasi bahwa "Pilih Rencana Strategis" dan daftar RS tidak muncul di latar belakang
5. Navigasi ke halaman lain dan verifikasi hal yang sama

## Tanggal Perbaikan
7 Januari 2026
