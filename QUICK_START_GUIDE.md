# 🚀 Quick Start Guide - Aplikasi Manajemen Risiko

**Versi**: 2.0  
**Update**: 13 Desember 2025

---

## 📖 Daftar Isi

1. [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
2. [Menggunakan Data Dummy](#menggunakan-data-dummy)
3. [Navigasi Menu](#navigasi-menu)
4. [Fitur Utama](#fitur-utama)
5. [Tips & Trik](#tips--trik)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Cara Menjalankan Aplikasi

### Prerequisite
- Node.js v18+
- npm v8+
- Supabase account (sudah dikonfigurasi)

### Langkah-langkah

1. **Clone/Download Project**
   ```bash
   cd D:\APLIKASI_cursor\ManajemenResikoProject
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   - File `.env` sudah dikonfigurasi
   - Supabase connection ready

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   ```
   http://localhost:3000
   ```

6. **Login**
   - Gunakan kredensial yang sudah terdaftar
   - Data dummy sudah diinsert otomatis

---

## 🗄️ Menggunakan Data Dummy

### Data Sudah Tersedia ✅

Data dummy telah diinsert ke database untuk testing:

- ✅ 1 Visi Misi
- ✅ 1 Rencana Strategis (RS-2025-001)
- ✅ 3 Unit Kerja (IGD, Poli Umum, Rawat Inap)
- ✅ 5+ SWOT Analysis
- ✅ 4 Sasaran Strategi
- ✅ 2 Risk Inputs
- ✅ 2 Inherent Risk Analysis
- ✅ 2 Residual Risk Analysis
- ✅ 2 Peluang
- ✅ 1 Monitoring

### Cara Mengakses Data

**Option 1: Langsung Gunakan**
```
1. Login ke aplikasi
2. Pilih menu yang ingin dilihat
3. Data dummy akan tampil otomatis
```

**Option 2: Re-insert Data (jika perlu)**
```sql
-- Jalankan query SQL di Supabase dashboard
-- File: queries-dummy-data.sql (refer to TESTING_REPORT.md)
```

---

## 🧭 Navigasi Menu

### Menu Utama

```
📊 Dashboard
   ├── Overview statistik risiko
   └── Quick access ke fitur utama

📋 Rencana Strategis
   ├── Visi & Misi
   ├── Rencana Strategis
   └── Sasaran Strategi

🔍 Analisis SWOT
   ├── Analisis SWOT (ENHANCED ✨)
   └── Diagram Kartesius (AUTO-AGREGASI ✨)

🗺️  Strategic Map (FIXED ✨)
   └── Generate & visualisasi BSC

⚠️  Input & Risiko
   ├── Input Risiko
   ├── Monitoring & Evaluasi (ENHANCED ✨)
   └── Peluang (AUTO-CALC ✨)

📈 Analisis Risiko
   ├── Risk Profile (NEW ✨)
   ├── Residual Risk (NEW ✨)
   ├── KRI
   ├── Loss Event
   └── Early Warning System

📑 Laporan (REDESIGNED ✨)
   └── 8 jenis laporan dengan preview
```

---

## 🎨 Fitur Utama

### 1. Analisis SWOT (ENHANCED)

**Cara Menggunakan**:
```
1. Pilih menu "Analisis SWOT"
2. Pilih filter:
   - Rencana Strategis: RS-2025-001
   - Unit Kerja: IGD / Semua
   - Tahun: 2025
3. Klik "Tambah Analisis"
4. Isi form:
   ✅ Unit Kerja: Pilih dari dropdown
   ✅ Kategori: Strength/Weakness/Opportunity/Threat
   ✅ Objek Analisis: Deskripsi
   ✅ Bobot: 1-100
   ✅ Kuantitas: Jumlah item
   ✅ Rank: 1-5
5. Simpan
6. Data akan tampil di tabel dengan unit kerja
```

**Fitur Baru**:
- ✨ Filter per unit kerja
- ✨ Input kuantitas
- ✨ Display unit kerja di tabel

---

### 2. Diagram Kartesius (AUTO-AGREGASI)

**Cara Menggunakan**:
```
1. Pilih menu "Diagram Kartesius"
2. Pilih Rencana Strategis: RS-2025-001
3. Pilih filter:
   
   Option A: Level Rumah Sakit
   - Kosongkan unit kerja
   - Sistem akan agregat semua unit
   
   Option B: Per Unit Kerja
   - Pilih unit kerja: IGD
   - Sistem hanya hitung data unit tersebut

4. Klik "Hitung"
5. Diagram akan tampil dengan posisi:
   - X axis: Opportunity - Threat
   - Y axis: Strength - Weakness
```

**Magic Auto-Agregasi**:
```
Jika pilih "Rumah Sakit":
- ✅ Otomatis sum semua Strength dari semua unit
- ✅ Otomatis sum semua Weakness dari semua unit
- ✅ Otomatis sum semua Opportunity dari semua unit
- ✅ Otomatis sum semua Threat dari semua unit
- ✅ Pilih nilai dengan kuantitas dan bobot tertinggi
```

**Contoh Hasil**:
```
Data Sample:
- IGD Strength: 100 + 150 = 250
- Poli Weakness: 60
- Rawat Inap Opportunity: 100
- IGD Threat: 45

Hasil:
X = 100 - 45 = 55
Y = 250 - 60 = 190
Posisi: Kuadran I (Agresif)
```

---

### 3. Strategic Map (FIXED)

**Cara Menggunakan**:
```
1. Pilih menu "Strategic Map"
2. Pastikan ada data Sasaran Strategi
3. Pilih Rencana Strategis: RS-2025-001
4. Klik "Generate"
5. Map akan terbentuk dengan 4 perspektif:
   🔵 ES (Eksternal Stakeholder)
   🟢 IBP (Internal Business Process)
   🟡 LG (Learning & Growth)
   🔴 Fin (Financial)
```

**Tampilan**:
- Cards per perspektif
- Color-coded borders
- Grid layout responsive
- Hover effects
- Drag-and-drop ready

---

### 4. Risk Profile (NEW)

**Cara Menggunakan**:
```
1. Pilih menu "Analisis Risiko" > "Risk Profile"
2. (Optional) Set filter:
   - Rencana Strategis
   - Unit Kerja
   - Kategori Risiko
   - Risk Level
3. Lihat:
   ✅ Statistics cards (Total, Extreme, High, Medium, Low)
   ✅ 5×5 Risk Matrix (Scatter chart)
   ✅ Legend dengan definisi level
   ✅ Detail table
4. Hover over points untuk detail
5. Klik "Refresh Data" untuk update
```

**Matrix Visual**:
```
         5|  🟡  🟠  🟠  🔴  🔴
         4|  🟡  🟡  🟠  🟠  🔴
Prob     3|  🟢  🟡  🟡  🟠  🟠
         2|  🟢  🟢  🟡  🟡  🟠
         1|  🟢  🟢  🟢  🟡  🟡
           ----------------------
             1   2   3   4   5
                  Impact

🟢 Low Risk (<5)
🟡 Medium Risk (5-9)
🟠 High Risk (10-15)
🔴 Extreme High (≥16)
```

---

### 5. Residual Risk (NEW)

**Cara Menggunakan**:
```
1. Pilih menu "Analisis Risiko" > "Residual Risk"
2. Set filter (optional)
3. Lihat:
   ✅ Statistics (Avg Inherent, Avg Residual, Reduction %)
   ✅ Residual Risk Matrix
   ✅ Inherent vs Residual Comparison (Bar chart)
   ✅ Detail table dengan reduction %
```

**Comparison Chart**:
```
Risk Value
    |
 20 |  ██████          Inherent
    |  ██████  ████    Residual
 15 |  ██████  ████
    |  ██████  ████
 10 |  ██████  ████
    |  ██████  ████
  5 |  ██████  ████
    |  ██████  ████
  0 |__________________
      OPR-001  OPR-002
      
Reduction: 62.5%  55.6%
```

---

### 6. Monitoring & Evaluasi (ENHANCED)

**Cara Menggunakan**:
```
1. Pilih menu "Input & Risiko" > "Monitoring & Evaluasi"
2. Lihat statistics:
   ✅ Total monitoring
   ✅ Completed (100%)
   ✅ In progress
   ✅ Average progress
3. Lihat Progress Chart
4. Klik "Tambah Monitoring" untuk input baru
```

**Progress Bar Visual**:
```
OPR-001: [████████████░░░░░░░░] 60% (Blue)
OPR-002: [████████████████████] 100% (Green)
OPR-003: [████░░░░░░░░░░░░░░░░] 20% (Red)

Color Logic:
≥75% → Green (Excellent)
≥50% → Blue (Good)
≥25% → Orange (Fair)
<25% → Red (Poor)
```

---

### 7. Peluang (AUTO-CALC)

**Cara Menggunakan**:
```
1. Pilih menu "Input & Risiko" > "Peluang"
2. Klik "Tambah Peluang"
3. Isi form:
   - Kode: PLG-001
   - Nama Peluang: Ekspansi telemedicine
   - Kategori: Strategis
   - Deskripsi: ...
   - Probabilitas: 4 (1-5)
   - Dampak Positif: 5 (1-5)
   
4. ✨ OTOMATIS: Nilai Peluang = 4 × 5 = 20
5. Lihat field "Nilai Peluang" terisi otomatis
6. Simpan
```

**Real-time Calculation**:
```javascript
onChange(probabilitas) → Calculate
onChange(dampak) → Calculate
Display: "Nilai Peluang (Otomatis): 20"
```

---

### 8. Laporan (REDESIGNED)

**Cara Menggunakan**:
```
1. Pilih menu "Laporan"
2. (Optional) Set filter:
   - Rencana Strategis: RS-2025-001
   - Unit Kerja: IGD
   - Dari Tanggal: 2025-01-01
   - Sampai Tanggal: 2025-12-31
   
3. Pilih laporan dari 8 cards:
   📚 Risk Register
   📊 Risk Profile
   🥧 Residual Risk
   🎯 Risk Appetite
   📈 KRI Dashboard
   ✅ Monitoring & Evaluasi
   ⚠️ Loss Event
   🗺️ Strategic Map

4. Aksi per card:
   🟢 Excel: Download .xlsx
   🔴 PDF: Download .pdf
   🔵 Preview: Lihat data (10 items)
```

**Report Card Design**:
```
┌─────────────────────────────────┐
│ 📊 Risk Profile                 │ ← Gradient header
│ (Blue to Purple)                │
├─────────────────────────────────┤
│ Profil risiko inherent dengan   │
│ matrix 5×5 dan analisis detail  │
│ per kategori risiko             │
│                                 │
│ [Excel] [PDF] [👁 Preview]     │ ← Action buttons
└─────────────────────────────────┘
```

---

## 💡 Tips & Trik

### Performance Tips

1. **Filter Data**
   - Gunakan filter untuk mempercepat load
   - Jangan load semua data sekaligus

2. **Refresh Strategis**
   - Hanya refresh saat perlu
   - Gunakan cache browser

3. **Chart Interaction**
   - Hover untuk detail tooltip
   - Click legend untuk toggle dataset

### Data Entry Tips

1. **SWOT Analysis**
   ```
   ✅ DO: Input data per unit kerja untuk analisis detail
   ✅ DO: Gunakan kuantitas untuk tracking jumlah
   ❌ DON'T: Skip unit kerja (akan sulit filter)
   ```

2. **Risk Input**
   ```
   ✅ DO: Link ke rencana strategis
   ✅ DO: Lengkapi inherent & residual analysis
   ❌ DON'T: Input risiko tanpa kategori
   ```

3. **Monitoring**
   ```
   ✅ DO: Update progress secara berkala
   ✅ DO: Isi evaluasi dengan detail
   ❌ DON'T: Set progress 100% tanpa verifikasi
   ```

### Workflow Best Practices

```
1. Input Visi Misi
   ↓
2. Buat Rencana Strategis
   ↓
3. Definisikan Sasaran Strategi
   ↓
4. Generate Strategic Map
   ↓
5. Analisis SWOT per Unit Kerja
   ↓
6. Hitung Diagram Kartesius
   ↓
7. Input Risiko
   ↓
8. Analisis Inherent & Residual
   ↓
9. Monitoring & Evaluasi
   ↓
10. Generate Laporan
```

---

## 🔧 Troubleshooting

### Problem 1: Chart Tidak Tampil

**Symptom**: Canvas kosong atau error

**Solution**:
```
1. Check browser console (F12)
2. Pastikan Chart.js loaded
3. Refresh page (Ctrl+F5)
4. Clear cache
5. Check data ada (buka console, cek array)
```

### Problem 2: Filter Tidak Berfungsi

**Symptom**: Data tidak ter-filter

**Solution**:
```
1. Pastikan pilih value di dropdown
2. Check network tab (API called?)
3. Verify query params di URL
4. Refresh page
```

### Problem 3: Data Tidak Tersimpan

**Symptom**: Form submit tapi data tidak muncul

**Solution**:
```
1. Check console error
2. Verify all required fields filled
3. Check network response (200 OK?)
4. Check Supabase RLS policies
5. Verify user permissions
```

### Problem 4: Strategic Map Tidak Generate

**Symptom**: Click generate tapi tidak ada map

**Solution**:
```
1. Pastikan ada Sasaran Strategi
2. Check perspektif format (ES, IBP, LG, Fin)
3. Verify rencana strategis ID
4. Check API response
5. Refresh dan coba lagi
```

### Problem 5: Agregasi Salah Hitung

**Symptom**: Diagram kartesius nilai tidak sesuai

**Solution**:
```
1. Check data SWOT ada kuantitas & bobot
2. Verify filter unit kerja (kosong = all)
3. Manual calculate untuk verify
4. Check console log agregasi
5. Refresh data
```

---

## 📞 Support

### Getting Help

**Console Logs**:
```javascript
// Enable debug mode (add to localStorage)
localStorage.setItem('debug', 'true');
```

**Check Data**:
```javascript
// In browser console
console.log('State:', window.AnalisisSwotModule?.state);
console.log('Filters:', window.DiagramKartesiusModule?.state.filters);
```

**API Testing**:
```bash
# Test endpoint
curl http://localhost:3000/api/analisis-swot

# With filter
curl "http://localhost:3000/api/analisis-swot?unit_kerja_id=xxx"
```

---

## 🎓 Learning Resources

### Documentation
- `TESTING_REPORT.md` - Testing details
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- Inline comments in code

### Video Tutorials (Recommended to Create)
1. Cara input SWOT dengan unit kerja
2. Generate strategic map step-by-step
3. Analisis risk profile dan residual
4. Export laporan dengan filter

---

## ✅ Checklist Pengguna Baru

```
□ Install dependencies (npm install)
□ Setup .env file
□ Run development server (npm run dev)
□ Login ke aplikasi
□ Verify data dummy tampil
□ Test SWOT analysis dengan filter
□ Test diagram kartesius agregasi
□ Generate strategic map
□ Check risk profile chart
□ Check residual risk comparison
□ Test monitoring progress visual
□ Test peluang auto-calculate
□ Browse laporan dengan preview
□ Try export Excel
□ Familiarize dengan menu
```

---

## 🚀 Ready to Go!

Aplikasi siap digunakan! Jika ada pertanyaan:
1. Check TESTING_REPORT.md untuk test cases
2. Check IMPLEMENTATION_SUMMARY.md untuk technical details
3. Check console logs untuk debugging
4. Refer to inline code comments

**Selamat menggunakan Aplikasi Manajemen Risiko! 🎉**

---

**Version**: 2.0  
**Last Updated**: 13 Desember 2025  
**Status**: Production Ready ✅

