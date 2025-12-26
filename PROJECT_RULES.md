# Aturan Proyek ManajemenResikoProject

## Isolasi Proyek

### Scope Perubahan

**PENTING**: Semua perubahan, modifikasi, dan pengembangan pada aplikasi ini **HANYA** berlaku untuk proyek **ManajemenResikoProject** dan **TIDAK** berpengaruh kepada aplikasi lainnya yang berada di dalam folder aplikasi Cursor.

### Batasan

1. **Isolasi Folder**: Proyek ini berada di folder `ManajemenResikoProject` dan semua perubahan harus tetap berada dalam scope folder ini.

2. **Dependency Isolation**: 
   - Package dependencies (`package.json`, `node_modules`) hanya untuk proyek ini
   - Tidak memodifikasi konfigurasi global atau shared dependencies

3. **Database Isolation**: 
   - Menggunakan Supabase project yang spesifik untuk aplikasi ini
   - Semua tabel dan data terisolasi dalam schema yang sama

4. **Configuration Files**:
   - File konfigurasi (`.env`, `vercel.json`, dll) hanya untuk proyek ini
   - Tidak mempengaruhi konfigurasi aplikasi lain

5. **Code Changes**:
   - Semua perubahan kode hanya dalam folder `ManajemenResikoProject`
   - Tidak ada perubahan yang mempengaruhi parent directory atau sibling directories

### Prinsip Pengembangan

1. **Self-contained**: Aplikasi ini harus dapat berjalan independen tanpa bergantung pada aplikasi lain di folder Cursor
2. **No Side Effects**: Perubahan tidak boleh menyebabkan efek samping pada aplikasi lain
3. **Clear Boundaries**: Semua file dan konfigurasi jelas milik proyek ini
4. **Documentation**: Perubahan penting harus didokumentasikan dalam file ini atau README.md

### Implementasi

Ketika melakukan perubahan atau pengembangan:

1. Pastikan semua file yang dimodifikasi berada dalam folder `ManajemenResikoProject`
2. Jangan memodifikasi file di luar folder proyek ini
3. Jika perlu dependency baru, tambahkan ke `package.json` proyek ini saja
4. Test perubahan dalam isolasi proyek ini
5. Pastikan tidak ada hard-coded path yang mengarah ke luar folder proyek

### Verifikasi

Sebelum melakukan deployment atau commit besar:

- [ ] Semua file yang diubah berada dalam folder `ManajemenResikoProject`
- [ ] Tidak ada perubahan pada file di parent atau sibling directories
- [ ] Dependencies baru ditambahkan ke `package.json` proyek ini
- [ ] Environment variables spesifik untuk proyek ini
- [ ] Test dilakukan dalam isolasi proyek ini

---

**Last Updated**: 2025-01-16
**Project**: ManajemenResikoProject
**Location**: `D:\APLIKASI_cursor\ManajemenResikoProject`


