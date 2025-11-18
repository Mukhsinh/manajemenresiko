# Database Schema - Aplikasi Manajemen Risiko

## Ringkasan Database

Database menggunakan PostgreSQL di Supabase dengan Row Level Security (RLS) untuk keamanan multi-user.

## Tabel Master Data

### 1. master_probability_criteria
Kriteria probabilitas risiko (5 level)

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| index | INTEGER | Index (1-5) |
| probability | VARCHAR | Nama probabilitas |
| description | TEXT | Deskripsi |
| percentage | VARCHAR | Persentase |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

**Data yang sudah ter-seed:**
- Index 5: Sangat Besar (> 80%)
- Index 4: Besar (60 < p ≤ 80%)
- Index 3: Sedang (40 < p ≤ 60%)
- Index 2: Kecil (10 < p ≤ 40%)
- Index 1: Sangat Kecil (≤ 10%)

### 2. master_impact_criteria
Kriteria dampak risiko (5 level)

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| index | INTEGER | Index (1-5) |
| impact | VARCHAR | Nama dampak |
| description | TEXT | Deskripsi |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

**Data yang sudah ter-seed:**
- Index 5: Sangat Berat
- Index 4: Berat
- Index 3: Sedang
- Index 2: Ringan
- Index 1: Ringan Sekali

### 3. master_risk_categories
Kategori risiko (8 kategori)

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| name | VARCHAR | Nama kategori (unique) |
| definition | TEXT | Definisi kategori |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

**Data yang sudah ter-seed:**
1. Operasional
2. Kredit
3. Pasar
4. Likuiditas
5. Kepatuhan
6. Hukum
7. Reputasi
8. Strategis

### 4. master_work_units
Master unit kerja organisasi

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| name | VARCHAR | Nama unit kerja |
| code | VARCHAR | Kode unit kerja |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

**Data sample yang sudah ditambahkan:**
- BAGIAN TATA USAHA
- SUBBAGIAN PERENCANAAN DAN
- SUBBAGIAN UMUM DAN KEPEGAWAIAN
- SUBBAGIAN KEUANGAN
- BIDANG PELAYANAN MEDIS
- BIDANG PELAYANAN KEPERAWATAN
- BIDANG PENGEMBANGAN DAN PENUNJANG
- Dan unit-unit lainnya (total 20 unit)

## Tabel Transaksi

### 5. risk_inputs
Tabel utama untuk input data risiko

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key ke auth.users |
| no | INTEGER | Nomor urut (auto-generate) |
| kode_risiko | VARCHAR | Kode risiko (auto-generate) |
| status_risiko | VARCHAR | Status (default: 'Active') |
| jenis_risiko | VARCHAR | Jenis (default: 'Threat') |
| kategori_risiko_id | UUID | Foreign key ke master_risk_categories |
| nama_unit_kerja_id | UUID | Foreign key ke master_work_units |
| sasaran | TEXT | Sasaran risiko |
| tanggal_registrasi | DATE | Tanggal registrasi |
| penyebab_risiko | TEXT | Penyebab risiko |
| dampak_risiko | TEXT | Dampak risiko |
| pihak_terkait | TEXT | Pihak terkait |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

### 6. risk_inherent_analysis
Analisis risiko inherent

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| risk_input_id | UUID | Foreign key ke risk_inputs (unique) |
| probability | INTEGER | Probabilitas (1-5) |
| impact | INTEGER | Dampak (1-5) |
| risk_value | INTEGER | Nilai risiko (P × D) |
| risk_level | VARCHAR | Tingkat risiko |
| probability_percentage | VARCHAR | Persentase probabilitas |
| financial_impact | NUMERIC | Dampak finansial (Rp) |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

**Risk Level Mapping:**
- 1-4: LOW RISK
- 5-9: MEDIUM RISK
- 10-15: HIGH RISK
- 16-25: EXTREME HIGH

### 7. risk_residual_analysis
Analisis risiko residual (setelah treatment)

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| risk_input_id | UUID | Foreign key ke risk_inputs (unique) |
| probability | INTEGER | Probabilitas residual (1-5) |
| impact | INTEGER | Dampak residual (1-5) |
| risk_value | INTEGER | Nilai risiko residual (P × D) |
| risk_level | VARCHAR | Tingkat risiko residual |
| probability_percentage | VARCHAR | Persentase probabilitas |
| financial_impact | NUMERIC | Dampak finansial residual (Rp) |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

### 8. risk_treatments
Rencana penanganan risiko

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| risk_input_id | UUID | Foreign key ke risk_inputs |
| pemilik_risiko | VARCHAR | Pemilik risiko |
| jabatan_pemilik_risiko | VARCHAR | Jabatan pemilik |
| no_sp_pemilik_risiko | VARCHAR | No. SP pemilik |
| email_pemilik_risiko | VARCHAR | Email pemilik |
| status | VARCHAR | Status penanganan |
| penanganan_risiko | TEXT | Rencana penanganan |
| biaya_penanganan_risiko | NUMERIC | Biaya penanganan (Rp) |
| penanggung_jawab_penanganan_risiko | VARCHAR | Penanggung jawab |
| tanggal_registrasi | DATE | Tanggal registrasi |
| rencana_penanganan_risiko_mitigasi | TEXT | Rencana mitigasi |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

### 9. risk_appetite
Risk appetite per risiko

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| risk_input_id | UUID | Foreign key ke risk_inputs (unique) |
| user_id | UUID | Foreign key ke auth.users |
| risk_appetite_level | VARCHAR | Level risk appetite |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

**Risk Appetite Levels:**
- LOW RISK
- MEDIUM RISK
- HIGH RISK
- EXTREME HIGH

### 10. risk_monitoring
Monitoring risiko

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| risk_input_id | UUID | Foreign key ke risk_inputs (unique) |
| pemilik | VARCHAR | Pemilik monitoring |
| risk_management | TEXT | Catatan risk management |
| tanggal_terakhir_review_risiko | DATE | Tanggal review terakhir |
| tanggal_review_berikutnya | DATE | Tanggal review berikutnya |
| status_residual | VARCHAR | Status residual |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

### 11. user_profiles
Profil user tambahan

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key (foreign key ke auth.users) |
| email | VARCHAR | Email user |
| full_name | VARCHAR | Nama lengkap |
| created_at | TIMESTAMPTZ | Waktu dibuat |
| updated_at | TIMESTAMPTZ | Waktu diupdate |

## Relasi Tabel

```
auth.users
  └── user_profiles (1:1)
  └── risk_inputs (1:N)
      ├── risk_inherent_analysis (1:1)
      ├── risk_residual_analysis (1:1)
      ├── risk_treatments (1:N)
      ├── risk_appetite (1:1)
      └── risk_monitoring (1:1)

master_risk_categories
  └── risk_inputs (1:N)

master_work_units
  └── risk_inputs (1:N)
```

## Row Level Security (RLS)

Semua tabel memiliki RLS yang diaktifkan dengan policies:

1. **Master Data**: Read access untuk semua authenticated users
2. **User Profiles**: Users hanya bisa akses profil sendiri
3. **Risk Inputs**: Users hanya bisa akses risiko milik sendiri
4. **Analysis & Related Tables**: Access melalui risk_inputs (user ownership)

## Indexes

- `idx_risk_inputs_user_id` - Index pada user_id di risk_inputs
- `idx_risk_inputs_kategori` - Index pada kategori_risiko_id
- `idx_risk_appetite_user_id` - Index pada user_id di risk_appetite

## Triggers & Functions

- Auto-update `updated_at` timestamp (jika ada)
- Auto-generate `kode_risiko` dan `no` (dilakukan di aplikasi)

## Status Database

✅ Semua tabel sudah dibuat
✅ RLS policies sudah dikonfigurasi
✅ Master data sudah ter-seed
✅ Foreign keys sudah dikonfigurasi
✅ Indexes sudah dibuat

Database siap digunakan!

### 12. organization_chat_messages
Percakapan internal antar user pada organisasi yang sama.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| organization_id | UUID | Foreign key ke `organizations.id` |
| user_id | UUID | Foreign key ke `auth.users` / `user_profiles.id` |
| message | TEXT | Isi pesan (maks ±2.000 karakter disarankan) |
| attachments | JSONB (opsional) | Metadata lampiran (URL, tipe, dsb) |
| created_at | TIMESTAMPTZ | Waktu pesan dibuat |

**Catatan implementasi:**
- Tambahkan index gabungan pada `(organization_id, created_at)` untuk mempercepat load riwayat.
- RLS: beri izin `SELECT`/`INSERT` hanya untuk user yang memiliki baris pada `organization_users` dengan `organization_id` yang sama.
- Aktifkan `Supabase Realtime` pada tabel ini (opsi **Broadcast** + **Postgres Changes**).


