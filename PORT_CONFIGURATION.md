# Konfigurasi Port Aplikasi Manajemen Risiko

## Port yang Digunakan
- **Port Utama**: 3001
- **URL Akses**: http://localhost:3001

## Konfigurasi
Port dikonfigurasi di file `.env`:
```
PORT=3001
```

## Cara Menjalankan Aplikasi

### 1. Menggunakan npm
```bash
npm run dev
```

### 2. Menggunakan batch file (Windows)
```bash
start-dev.bat
```

### 3. Menggunakan port custom
```bash
PORT=3002 npm run dev
```

## Troubleshooting Port

Jika port 3001 sudah digunakan, aplikasi akan menampilkan error:
```
Port 3001 is already in use. Please use a different port.
```

### Solusi:
1. Ubah port di file `.env`
2. Atau gunakan environment variable:
   ```bash
   PORT=3002 npm run dev
   ```

## Status Server
Server berhasil berjalan jika melihat output:
```
========================================
Server running on port 3001
Access: http://localhost:3001
Environment: development
========================================
```

## Fitur Keamanan Port
- Error handling untuk port yang sudah digunakan
- Graceful shutdown
- Logging yang jelas untuk debugging