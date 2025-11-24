# Panduan Testing Import Data

## Format Excel untuk Import

### 1. Kriteria Probabilitas (Probability Criteria)

**Nama File**: `template-kriteria-probabilitas.xlsx`

**Kolom yang diperlukan**:
| Kolom | Tipe | Wajib | Contoh |
|-------|------|-------|--------|
| index | Number | Ya | 1, 2, 3, 4, 5 |
| probability | Text | Ya | Sangat Kecil |
| description | Text | Ya | Kemungkinan terjadi ≤ 10% |
| percentage | Text | Tidak | ≤ 10% |

**Contoh Data**:
```
index | probability    | description                      | percentage
------|----------------|----------------------------------|------------
1     | Sangat Kecil   | Kemungkinan terjadi ≤ 10%       | ≤ 10%
2     | Kecil          | Kemungkinan terjadi 10-40%      | 10-40%
3     | Sedang         | Kemungkinan terjadi 40-60%      | 40-60%
4     | Besar          | Kemungkinan terjadi 60-80%      | 60-80%
5     | Sangat Besar   | Kemungkinan terjadi > 80%       | > 80%
```

**Catatan**:
- Index harus unik (1-5)
- Jika import data dengan index yang sama, data lama akan di-update
- Index akan otomatis dikonversi ke number

---

### 2. Kriteria Dampak (Impact Criteria)

**Nama File**: `template-kriteria-dampak.xlsx`

**Kolom yang diperlukan**:
| Kolom | Tipe | Wajib | Contoh |
|-------|------|-------|--------|
| index | Number | Ya | 1, 2, 3, 4, 5 |
| impact | Text | Ya | Ringan Sekali |
| description | Text | Ya | Dampak sangat kecil |

**Contoh Data**:
```
index | impact         | description
------|----------------|----------------------------------
1     | Ringan Sekali  | Dampak sangat kecil, tidak signifikan
2     | Ringan         | Dampak kecil, dapat ditangani dengan mudah
3     | Sedang         | Dampak menengah, memerlukan perhatian
4     | Berat          | Dampak besar, memerlukan tindakan segera
5     | Sangat Berat   | Dampak sangat besar, kritis
```

**Catatan**:
- Index harus unik (1-5)
- Jika import data dengan index yang sama, data lama akan di-update

---

### 3. Kategori Risiko (Risk Categories)

**Nama File**: `template-kategori-risiko.xlsx`

**Kolom yang diperlukan**:
| Kolom | Tipe | Wajib | Contoh |
|-------|------|-------|--------|
| name | Text | Ya | Operasional |
| definition | Text | Ya | Risiko yang terkait dengan operasional sehari-hari |

**Contoh Data**:
```
name        | definition
------------|--------------------------------------------------
Operasional | Risiko yang terkait dengan operasional sehari-hari
Kredit      | Risiko yang terkait dengan pemberian kredit
Pasar       | Risiko yang terkait dengan perubahan pasar
Likuiditas  | Risiko yang terkait dengan likuiditas
Kepatuhan   | Risiko yang terkait dengan kepatuhan regulasi
Hukum       | Risiko yang terkait dengan aspek hukum
Reputasi    | Risiko yang terkait dengan reputasi organisasi
Strategis   | Risiko yang terkait dengan strategi bisnis
```

**Catatan**:
- Name harus unik
- Jika import data dengan name yang sama, data lama akan di-update
- Biasanya ada 8 kategori standar

---

### 4. Unit Kerja (Work Units)

**Nama File**: `template-unit-kerja.xlsx`

**Kolom yang diperlukan**:
| Kolom | Tipe | Wajib | Contoh |
|-------|------|-------|--------|
| name | Text | Ya | Bagian Tata Usaha |
| code | Text | Tidak | UK001 (auto-generate jika kosong) |
| organization_code | Text | Tidak | ORG001 |
| organization_name | Text | Tidak | RSUD Bendan |
| manager_name | Text | Tidak | John Doe |
| manager_email | Text | Tidak | john@example.com |

**Contoh Data**:
```
name                  | code  | organization_code | manager_name | manager_email
----------------------|-------|-------------------|--------------|------------------
Bagian Tata Usaha     | UK001 | ORG001           | John Doe     | john@example.com
Subbagian Perencanaan | UK002 | ORG001           | Jane Smith   | jane@example.com
Bidang Pelayanan Medis| UK003 | ORG001           | Bob Johnson  | bob@example.com
```

**Catatan**:
- Name harus diisi
- Code akan auto-generate jika tidak diisi (format: UK001, UK002, dst)
- Organization akan di-resolve dari organization_code atau organization_name
- Jika organization tidak ditemukan, data tetap akan di-import tanpa organization_id

---

## Langkah-langkah Testing

### Persiapan
1. Pastikan server berjalan di `localhost:3000`
2. Login sebagai superadmin atau admin
3. Buka halaman Master Data

### Test Import Kriteria Probabilitas

1. **Download Template**
   - Klik tab "Kriteria Probabilitas"
   - Klik tombol "Unduh Template"
   - Buka file Excel yang ter-download

2. **Isi Data**
   - Isi 5 baris data sesuai contoh di atas
   - Pastikan index 1-5 terisi semua
   - Simpan file

3. **Import Data**
   - Klik tombol "Import Data"
   - Pilih file Excel yang sudah diisi
   - Tunggu proses import

4. **Verifikasi**
   - ✅ Alert "Import berhasil" muncul
   - ✅ Data langsung muncul di tabel tanpa refresh
   - ✅ Semua 5 data terlihat dengan benar
   - ✅ Kolom index, probability, description, percentage terisi

5. **Test Update (Import Ulang)**
   - Edit file Excel, ubah description pada index 1
   - Import ulang file yang sama
   - ✅ Tidak ada error duplicate key
   - ✅ Data index 1 ter-update dengan description baru
   - ✅ Data lain tetap sama

### Test Import Kriteria Dampak

1. **Download Template**
   - Klik tab "Kriteria Dampak"
   - Klik tombol "Unduh Template"

2. **Isi Data**
   - Isi 5 baris data sesuai contoh
   - Simpan file

3. **Import & Verifikasi**
   - Import file
   - ✅ Data langsung muncul
   - ✅ Semua kolom terisi dengan benar

4. **Test Update**
   - Edit dan import ulang
   - ✅ Tidak ada error
   - ✅ Data ter-update

### Test Import Kategori Risiko

1. **Download Template**
   - Klik tab "Kategori Risiko"
   - Klik tombol "Unduh Template"

2. **Isi Data**
   - Isi 8 kategori standar
   - Simpan file

3. **Import & Verifikasi**
   - Import file
   - ✅ Data langsung muncul
   - ✅ Semua 8 kategori terlihat

4. **Test Update**
   - Edit definition salah satu kategori
   - Import ulang
   - ✅ Tidak ada error
   - ✅ Definition ter-update

### Test Import Unit Kerja

1. **Persiapan**
   - Pastikan sudah ada organisasi di sistem
   - Catat kode organisasi (misal: ORG001)

2. **Download Template**
   - Klik tab "Unit Kerja"
   - Klik tombol "Unduh Template"

3. **Isi Data**
   - Isi beberapa unit kerja
   - Isi organization_code dengan kode yang valid
   - Kosongkan code (akan auto-generate)
   - Simpan file

4. **Import & Verifikasi**
   - Import file
   - ✅ Data langsung muncul
   - ✅ Code ter-generate otomatis (UK001, UK002, dst)
   - ✅ Organisasi ter-link dengan benar

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Penyebab**: Versi lama masih menggunakan upsert tanpa onConflict
**Solusi**: Pastikan sudah menggunakan kode terbaru dengan onConflict

### Data tidak muncul setelah import
**Penyebab**: 
1. RLS policy memblokir akses
2. Frontend tidak reload data

**Solusi**:
1. Pastikan menggunakan supabaseAdmin client
2. Pastikan `loadMasterDataContent()` dipanggil setelah import

### Error: "Data import tidak valid atau tidak ada index"
**Penyebab**: Kolom index kosong atau tidak ada
**Solusi**: Pastikan kolom index terisi untuk semua baris

### Organization tidak ter-link pada Unit Kerja
**Penyebab**: organization_code atau organization_name tidak cocok
**Solusi**: 
1. Cek kode organisasi yang benar di halaman Pengaturan
2. Pastikan organization_code atau organization_name sesuai

---

## Expected Results

Setelah semua testing selesai, Anda harus memiliki:

### Kriteria Probabilitas
- ✅ 5 data dengan index 1-5
- ✅ Semua kolom terisi
- ✅ Data dapat di-update dengan import ulang

### Kriteria Dampak
- ✅ 5 data dengan index 1-5
- ✅ Semua kolom terisi
- ✅ Data dapat di-update dengan import ulang

### Kategori Risiko
- ✅ 8 kategori standar
- ✅ Semua kolom terisi
- ✅ Data dapat di-update dengan import ulang

### Unit Kerja
- ✅ Beberapa unit kerja
- ✅ Code auto-generate
- ✅ Organization ter-link
- ✅ Manager info terisi

---

## Next Steps

Setelah import berhasil:
1. Test CRUD operations (Create, Read, Update, Delete) melalui UI
2. Test export data ke Excel
3. Verifikasi data dapat digunakan di modul lain (Risk Input, dll)
4. Test dengan multiple users dan organizations
