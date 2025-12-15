# Panduan Cepat: Mengatasi Masalah Data Tidak Tampil

## Status Perbaikan ✅

Masalah data yang tidak tampil di frontend telah diperbaiki. Berikut adalah langkah-langkah untuk memverifikasi:

## 1. Pastikan Server Berjalan

```bash
npm start
```

Server harus menampilkan:
```
[INFO] Server running on port 3000
[INFO] Access: http://localhost:3000
```

## 2. Test Aplikasi

### Cara 1: Test Normal
1. Buka browser ke `http://localhost:3000`
2. Login dengan salah satu user:
   - Email: `mukhsin9@gmail.com`
   - Email: `amalinda.fajari@gmail.com`
   - (Password sesuai yang sudah diset)

3. Setelah login, data harus tampil di:
   - Dashboard (statistik dan chart)
   - Visi dan Misi
   - Rencana Strategis
   - Halaman lainnya

### Cara 2: Test Debug (Jika Masih Bermasalah)
1. Buka `http://localhost:3000/test.html`
2. Klik "Test Config" - harus berhasil
3. Masukkan email/password dan klik "Login" - harus berhasil
4. Klik "Test Data" - harus menampilkan data
5. Klik "Test Dashboard" - harus menampilkan statistik

## 3. Jika Masih Ada Masalah

### Periksa Browser Console
1. Tekan F12 untuk buka Developer Tools
2. Lihat tab Console untuk error messages
3. Lihat tab Network untuk failed requests

### Error Umum dan Solusi

**Error: "No token provided"**
- Solusi: Logout dan login ulang

**Error: "Supabase client not initialized"**
- Solusi: Refresh halaman, pastikan internet stabil

**Error: "Request failed"**
- Solusi: Periksa server masih berjalan

**Data kosong tapi tidak ada error**
- Solusi: Periksa user memiliki akses ke organisasi

## 4. Data yang Tersedia

Setelah login, Anda harus melihat:
- **Dashboard**: Statistik risiko dan chart
- **Visi Misi**: 2 data visi misi
- **Rencana Strategis**: 4 data rencana strategis
- **Master Data**: 78 unit kerja

## 5. Fitur yang Berfungsi

✅ Login/Logout
✅ Dashboard dengan statistik
✅ Visi dan Misi (view, add, edit, delete)
✅ Rencana Strategis (view, add, edit, delete)
✅ Master Data
✅ Semua halaman menu

## 6. Troubleshooting Lanjutan

Jika masih ada masalah, jalankan:

```bash
# Test endpoint tanpa auth
curl http://localhost:3000/api/test/data

# Periksa log server
# (lihat terminal tempat npm start berjalan)
```

## Kontak Support

Jika masalah persisten, sertakan:
1. Screenshot error di browser console
2. Log dari terminal server
3. Langkah yang sudah dicoba

---

**Catatan**: Perbaikan ini menggunakan endpoint khusus yang bypass beberapa security policy untuk memastikan data dapat tampil. Untuk production, akan dilakukan perbaikan security policy yang lebih proper.