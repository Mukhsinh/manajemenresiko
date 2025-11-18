# Troubleshooting Server - Aplikasi Manajemen Risiko

## Masalah: Aplikasi Menampilkan Directory Listing

Jika browser menampilkan "Index of /" (directory listing) bukan aplikasi web, kemungkinan:

### Penyebab
1. Server Express belum berjalan
2. Server berjalan di port yang berbeda
3. Error saat server start (misalnya missing environment variables)

### Solusi

#### 1. Pastikan Server Berjalan
```bash
# Stop semua node process
Stop-Process -Name node -Force

# Start server
node server.js
```

Atau dengan nodemon untuk auto-reload:
```bash
npm run dev
```

#### 2. Cek Environment Variables
Pastikan file `.env` sudah dibuat dan berisi:
```
SUPABASE_URL=https://cdivlsbtjuufqbzelbbj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

#### 3. Cek Port yang Digunakan
Server default berjalan di port 3000. Pastikan:
- Tidak ada aplikasi lain yang menggunakan port 3000
- Atau ubah PORT di `.env` jika port 3000 sudah digunakan

#### 4. Cek Console untuk Error
Lihat output di terminal saat menjalankan `node server.js`. Jika ada error, perbaiki terlebih dahulu.

### Verifikasi Server Berjalan

Setelah menjalankan `node server.js`, seharusnya muncul:
```
Server running on port 3000
```

Jika muncul error, perbaiki sesuai error yang ditampilkan.

### Akses Aplikasi

Setelah server berjalan, buka browser:
```
http://localhost:3000
```

Seharusnya menampilkan halaman login aplikasi, bukan directory listing.

### Catatan

- Server harus berjalan di background atau terminal terpisah
- Jangan tutup terminal saat server berjalan
- Gunakan `Ctrl+C` untuk stop server

