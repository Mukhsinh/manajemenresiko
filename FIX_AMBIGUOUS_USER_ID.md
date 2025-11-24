# Fix Ambiguous User ID Error

## Masalah
Error "column reference 'user_id' is ambiguous" terjadi ketika melakukan query SQL dengan JOIN ke tabel lain yang juga memiliki kolom `user_id`. PostgreSQL tidak bisa menentukan kolom `user_id` mana yang dimaksud.

## Solusi
Menambahkan prefix nama tabel pada semua referensi kolom dalam query yang melibatkan JOIN.

## File yang Diperbaiki

### 1. routes/rencana-strategis.js
- **GET /** - Menambahkan prefix `rencana_strategis.organization_id`
- **GET /:id** - Menambahkan prefix `rencana_strategis.id` dan `rencana_strategis.organization_id`
- **PUT /:id** - Menambahkan prefix `rencana_strategis.id` dan `rencana_strategis.organization_id`
- **GET /actions/export** - Menambahkan prefix `rencana_strategis.organization_id`
- **POST /actions/import** - Menambahkan prefix `visi_misi.organization_id`

### 2. routes/sasaran-strategi.js
- **GET /** - Menambahkan prefix `sasaran_strategi.user_id`
- **GET /:id** - Menambahkan prefix `sasaran_strategi.id` dan `sasaran_strategi.user_id`
- **PUT /:id** - Menambahkan prefix `sasaran_strategi.id` dan `sasaran_strategi.user_id`
- **DELETE /:id** - Menambahkan prefix `sasaran_strategi.id` dan `sasaran_strategi.user_id`

### 3. routes/strategic-map.js
- **GET /** - Menambahkan prefix `strategic_map.user_id`
- **GET /:id** - Menambahkan prefix `strategic_map.id` dan `strategic_map.user_id`
- **PUT /:id** - Menambahkan prefix `strategic_map.id` dan `strategic_map.user_id`
- **DELETE /:id** - Menambahkan prefix `strategic_map.id` dan `strategic_map.user_id`

### 4. routes/indikator-kinerja-utama.js
- **GET /** - Menambahkan prefix `indikator_kinerja_utama.user_id`
- **GET /:id** - Menambahkan prefix `indikator_kinerja_utama.id` dan `indikator_kinerja_utama.user_id`
- **PUT /:id** - Menambahkan prefix `indikator_kinerja_utama.id` dan `indikator_kinerja_utama.user_id`
- **DELETE /:id** - Menambahkan prefix `indikator_kinerja_utama.id` dan `indikator_kinerja_utama.user_id`

### 5. routes/matriks-tows.js
- **GET /** - Menambahkan prefix `swot_tows_strategi.user_id`
- **GET /:id** - Menambahkan prefix `swot_tows_strategi.id` dan `swot_tows_strategi.user_id`
- **PUT /:id** - Menambahkan prefix `swot_tows_strategi.id` dan `swot_tows_strategi.user_id`
- **DELETE /:id** - Menambahkan prefix `swot_tows_strategi.id` dan `swot_tows_strategi.user_id`

### 6. routes/diagram-kartesius.js
- **GET /** - Menambahkan prefix `swot_diagram_kartesius.user_id`
- **GET /:id** - Menambahkan prefix `swot_diagram_kartesius.id` dan `swot_diagram_kartesius.user_id`
- **PUT /:id** - Menambahkan prefix `swot_diagram_kartesius.id` dan `swot_diagram_kartesius.user_id`
- **DELETE /:id** - Menambahkan prefix `swot_diagram_kartesius.id` dan `swot_diagram_kartesius.user_id`

## Contoh Perubahan

### Sebelum:
```javascript
.eq('user_id', req.user.id)
```

### Sesudah:
```javascript
.eq('table_name.user_id', req.user.id)
```

## Testing
Setelah perbaikan ini, error "column reference 'user_id' is ambiguous" seharusnya tidak muncul lagi saat:
- Menyimpan rencana strategis
- Mengakses data dengan JOIN ke tabel lain
- Melakukan operasi CRUD pada modul yang menggunakan relasi antar tabel

## Catatan
Perbaikan ini mengikuti best practice SQL untuk menghindari ambiguitas kolom dengan selalu menggunakan qualified column names (table_name.column_name) dalam query yang melibatkan multiple tables.
