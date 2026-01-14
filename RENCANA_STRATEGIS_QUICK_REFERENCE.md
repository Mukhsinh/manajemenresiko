# RENCANA STRATEGIS - QUICK REFERENCE GUIDE

## 🚀 Quick Start

### Akses Halaman:
```
http://localhost:3002/rencana-strategis
```

### Test Standalone:
```
http://localhost:3002/test-rencana-strategis-fixed.html
```

---

## 📋 Fitur Utama

### 1. Kartu Statistik
- **Rencana Aktif** (hijau): Jumlah rencana dengan status Aktif
- **Draft** (orange): Jumlah rencana dengan status Draft
- **Selesai** (biru): Jumlah rencana dengan status Selesai
- **Total Rencana** (ungu): Total semua rencana

### 2. Form Input
- Klik **"Tambah Baru"** untuk membuka form
- Klik **"Tutup"** atau **"X"** untuk menutup form
- Kode rencana **auto-generate**
- Tambah sasaran/IKU dengan tombol **"+"**

### 3. Tabel Data
- **View** (👁): Lihat detail lengkap
- **Edit** (✏): Edit rencana
- **Delete** (🗑): Hapus rencana

### 4. Search & Filter
- **Search**: Ketik nama rencana
- **Status**: Filter by Aktif/Draft/Selesai
- **Tahun**: Filter by tahun periode
- **Reset**: Hapus semua filter

### 5. Import/Export
- **Import**: Upload Excel file
- **Export**: Download data ke Excel

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate elements |
| `Enter` | Confirm/Submit |
| `Escape` | Close modal |
| `Ctrl+F` | Search (browser) |

---

## 🎨 Status Colors

| Status | Color | Badge |
|--------|-------|-------|
| Aktif | Green | ![#4caf50](https://via.placeholder.com/15/4caf50/000000?text=+) |
| Draft | Orange | ![#ff9800](https://via.placeholder.com/15/ff9800/000000?text=+) |
| Selesai | Gray | ![#6c757d](https://via.placeholder.com/15/6c757d/000000?text=+) |

---

## 🔔 Toast Notifications

| Type | Color | Icon | Usage |
|------|-------|------|-------|
| Success | Green | ✓ | Data saved/deleted |
| Error | Red | ✗ | Operation failed |
| Warning | Yellow | ⚠ | Validation error |
| Info | Blue | ℹ | Information |

---

## 📝 Form Fields

### Required Fields:
- ✅ Nama Rencana Strategis

### Optional Fields:
- Kode (auto-generated)
- Status (default: Draft)
- Misi Strategis
- Periode Mulai & Selesai
- Deskripsi
- Target
- Indikator Kinerja
- Sasaran Strategis (list)
- Indikator Kinerja Utama (list)

---

## 🔧 API Endpoints

```javascript
// Get all data
GET /api/rencana-strategis
GET /api/rencana-strategis/public

// Get by ID
GET /api/rencana-strategis/:id

// Create
POST /api/rencana-strategis

// Update
PUT /api/rencana-strategis/:id

// Delete
DELETE /api/rencana-strategis/:id

// Generate kode
GET /api/rencana-strategis/generate/kode/public

// Export
GET /api/rencana-strategis/actions/export

// Import
POST /api/rencana-strategis/actions/import
```

---

## 🐛 Common Issues

### Issue: Halaman kosong
**Fix:** Clear cache (Ctrl+Shift+R)

### Issue: Data tidak muncul
**Fix:** Check API connection

### Issue: Form tidak muncul
**Fix:** Click "Tambah Baru" button

### Issue: Toast tidak muncul
**Fix:** Check Bootstrap JS loaded

### Issue: Modal stuck
**Fix:** Press Escape or refresh page

---

## 📱 Responsive Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Desktop | > 1200px | Full features |
| Tablet | 768-1199px | Adapted |
| Mobile | < 768px | Stacked |

---

## ✅ Testing Checklist

- [ ] Kartu statistik muncul
- [ ] Form bisa dibuka/ditutup
- [ ] Tabel menampilkan data
- [ ] Search berfungsi
- [ ] Filter berfungsi
- [ ] Pagination berfungsi
- [ ] CRUD operations work
- [ ] Import/Export work
- [ ] Toast notifications show
- [ ] Modals work properly

---

## 📞 Quick Help

### Files:
- **Main Module:** `public/js/rencana-strategis-fixed.js`
- **UX Module:** `public/js/rencana-strategis-enhanced-ux.js`
- **Main CSS:** `public/css/rencana-strategis-fixed.css`
- **UX CSS:** `public/css/rencana-strategis-enhanced-ux.css`

### Documentation:
- **Complete Guide:** `RENCANA_STRATEGIS_DISPLAY_FIXED_COMPLETE.md`
- **UX Features:** `RENCANA_STRATEGIS_ENHANCED_UX_COMPLETE.md`
- **Full Summary:** `RENCANA_STRATEGIS_FINAL_COMPLETE_SUMMARY.md`

### Test:
- **Test Script:** `test-rencana-strategis-display-fixed.js`
- **Test Page:** `public/test-rencana-strategis-fixed.html`

---

## 🎯 Quick Commands

### Run Tests:
```bash
node test-rencana-strategis-display-fixed.js
```

### Start Server:
```bash
npm start
# or
node server.js
```

### Access Application:
```
http://localhost:3002
```

---

**Version:** 2.0 Enhanced  
**Status:** ✅ Production Ready  
**Last Updated:** 6 Januari 2026
