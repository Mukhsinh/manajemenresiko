# Filter Tahun Dropdown Fix

## Tanggal: 7 Januari 2026

## Ringkasan
Memastikan filter tahun di halaman `/diagram-kartesius`, `/matriks-tows`, dan `/indikator-kinerja-utama` menggunakan model dropdown dan berfungsi normal.

## Status Per Halaman

### 1. Diagram Kartesius (`/diagram-kartesius`)
- ✅ Filter tahun menggunakan dropdown (`<select>`)
- ✅ Fungsi `generateYearOptions()` tersedia
- ✅ Filter `applyFilter()` berfungsi dengan benar
- ✅ Backend route mendukung filter tahun

### 2. Matriks TOWS (`/matriks-tows`)
- ✅ Filter tahun diubah dari `<input type="number">` ke `<select>` dropdown
- ✅ Fungsi `generateYearOptions()` tersedia
- ✅ Filter `applyFilter()` berfungsi dengan benar
- ✅ Backend route mendukung filter tahun

### 3. Indikator Kinerja Utama (`/indikator-kinerja-utama`)
- ✅ Filter tahun menggunakan dropdown (`<select>`)
- ✅ Fungsi `generateYearOptions()` tersedia
- ✅ Filter `applyFilter()` berfungsi dengan benar
- ✅ Backend route mendukung filter tahun

## Perubahan yang Dilakukan

### File: `public/js/matriks-tows.js`
```javascript
// SEBELUM (input number):
<input type="number" class="form-control" id="filter-tahun" value="${state.filters.tahun}" onchange="MatriksTowsModule.applyFilter()">

// SESUDAH (dropdown select):
<select class="form-control" id="filter-tahun" onchange="MatriksTowsModule.applyFilter()">
  ${generateYearOptions(state.filters.tahun)}
</select>
```

## Fungsi generateYearOptions
Semua halaman menggunakan fungsi yang sama untuk generate opsi tahun:
- Range: 5 tahun ke belakang sampai 5 tahun ke depan
- Tahun saat ini dipilih secara default
- Urutan: dari tahun terbaru ke terlama

```javascript
function generateYearOptions(selectedYear) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;
  const endYear = currentYear + 5;
  let options = '';
  const selectedYearInt = parseInt(selectedYear) || currentYear;
  
  for (let year = endYear; year >= startYear; year--) {
    const selected = year === selectedYearInt ? 'selected' : '';
    options += `<option value="${year}" ${selected}>${year}</option>`;
  }
  return options;
}
```

## Filter Lainnya yang Tersedia

### Diagram Kartesius
- Unit Kerja (dropdown)
- Jenis (dropdown)
- Kategori (dropdown)
- Tahun (dropdown) ✅

### Matriks TOWS
- Rencana Strategis (dropdown)
- Tipe Strategi (dropdown: SO, WO, ST, WT)
- Tahun (dropdown) ✅

### Indikator Kinerja Utama
- Rencana Strategis (dropdown)
- Sasaran Strategi (dropdown)
- Tahun (dropdown) ✅

## Testing
File test tersedia di: `/test-filter-tahun-dropdown.html`

## Cara Verifikasi
1. Buka aplikasi dan login
2. Navigasi ke masing-masing halaman:
   - `/diagram-kartesius`
   - `/matriks-tows`
   - `/indikator-kinerja-utama`
3. Pastikan filter tahun menampilkan dropdown dengan opsi tahun
4. Ubah tahun dan pastikan data ter-filter sesuai tahun yang dipilih
