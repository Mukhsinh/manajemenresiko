# Troubleshooting: Tabel Tidak Terlihat di Supabase Dashboard

## ✅ STATUS: SEMUA TABEL SUDAH ADA DI DATABASE

Berdasarkan verifikasi langsung ke database melalui MCP tools, **semua 11 tabel aplikasi sudah ada dan lengkap**.

### Daftar Tabel yang Terverifikasi:

#### Master Data (4 tabel)
1. ✅ `master_probability_criteria` - 5 rows
2. ✅ `master_impact_criteria` - 5 rows  
3. ✅ `master_risk_categories` - 8 rows
4. ✅ `master_work_units` - 40 rows

#### Transaction Data (6 tabel)
5. ✅ `risk_inputs` - Tabel utama
6. ✅ `risk_inherent_analysis` - Analisis inherent
7. ✅ `risk_residual_analysis` - Analisis residual
8. ✅ `risk_treatments` - Rencana penanganan
9. ✅ `risk_appetite` - Risk appetite
10. ✅ `risk_monitoring` - Monitoring

#### User Management (1 tabel)
11. ✅ `user_profiles` - Profil user

## 🔍 MENGAPA TIDAK TERLIHAT DI DASHBOARD?

Kemungkinan penyebab:

### 1. **Cache Browser**
- Browser menyimpan cache lama
- **Solusi**: Hard refresh dengan `Ctrl + F5` atau `Ctrl + Shift + R`

### 2. **Project yang Berbeda**
- URL di browser: `cdivlsbtjuufqbzelbbj`
- Pastikan project yang dipilih di dashboard sama dengan yang dikonfigurasi

### 3. **Filter/Search Aktif**
- Search bar mungkin memiliki filter
- **Solusi**: Kosongkan search bar dan hapus semua filter

### 4. **Schema yang Salah**
- Pastikan memilih schema `public` (bukan schema lain)
- Cek dropdown "schema public" di bagian atas Table Editor

### 5. **Permission/RLS**
- RLS mungkin membatasi tampilan
- Tapi ini tidak seharusnya mempengaruhi Table Editor untuk admin

## 🛠️ LANGKAH PERBAIKAN

### Langkah 1: Hard Refresh Browser
1. Tekan `Ctrl + F5` atau `Ctrl + Shift + R`
2. Atau buka Developer Tools (F12) → Network tab → centang "Disable cache"

### Langkah 2: Verifikasi Project
1. Pastikan URL di browser: `supabase.com/dashboard/project/cdivlsbtjuufqbzelbbj`
2. Pastikan project name: "Aplikasi Manajemen Resiko"

### Langkah 3: Clear Filter
1. Di Table Editor, pastikan search bar kosong
2. Hapus semua filter yang aktif
3. Pastikan dropdown menunjukkan "schema public"

### Langkah 4: Logout dan Login Kembali
1. Logout dari Supabase dashboard
2. Login kembali
3. Buka Table Editor

### Langkah 5: Verifikasi via SQL Editor
1. Buka **SQL Editor** di Supabase dashboard
2. Jalankan query ini:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (
        table_name LIKE 'risk_%' 
        OR table_name LIKE 'master_%'
        OR table_name = 'user_profiles'
    )
ORDER BY table_name;
```

Jika query ini mengembalikan 11 tabel, berarti tabel ada dan masalahnya hanya di tampilan Table Editor.

### Langkah 6: Coba Browser Lain
1. Buka Supabase dashboard di browser lain (Chrome, Firefox, Edge)
2. Atau gunakan mode incognito/private

## 📊 VERIFIKASI VIA MCP TOOLS

MCP tools sudah memverifikasi bahwa semua tabel ada:
- ✅ 11 tabel aplikasi terdeteksi
- ✅ Struktur tabel lengkap
- ✅ Foreign keys terpasang
- ✅ RLS policies aktif
- ✅ Master data ter-seed

## 🎯 KESIMPULAN

**Tabel-tabel sudah ada di database**, masalahnya kemungkinan besar adalah:
1. Cache browser
2. Filter/search di Table Editor
3. Project yang berbeda

**Rekomendasi**: 
1. Hard refresh browser (`Ctrl + F5`)
2. Verifikasi via SQL Editor
3. Jika masih tidak muncul, coba browser lain atau mode incognito

Database sudah siap digunakan meskipun tidak terlihat di Table Editor. Aplikasi akan tetap bisa mengakses semua tabel dengan benar.

