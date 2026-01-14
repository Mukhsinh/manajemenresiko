# Fix: Tombol Batal Memerlukan Dua Kali Klik

## Masalah
Tombol "Batal" pada form edit di halaman-halaman berikut memerlukan dua kali klik untuk menutup modal:
- /sasaran-strategi
- /strategic-map
- /indikator-kinerja-utama
- /risk-input
- /monitoring-evaluasi
- /peluang
- Dan halaman lainnya dengan fungsi edit

## Penyebab
1. Inline onclick handler (`onclick="this.closest('.modal').remove()"`) bersaing dengan event listener lain
2. Event capturing tidak menangkap semua kasus dengan benar
3. Delay pada animasi close menyebabkan event kedua masih bisa diproses

## Solusi (edit-form-fix.js v3.0)

### 1. WeakSet untuk Tracking Modal
Menggunakan `WeakSet` untuk melacak modal yang sedang ditutup, lebih reliable daripada property pada element.

### 2. Override Inline Handlers
Saat modal ditambahkan ke DOM, semua inline onclick handler pada tombol cancel/close dihapus dan diganti dengan handler kita.

### 3. Event Capturing dengan Pengecekan Lengkap
Event capturing di fase capture (sebelum bubbling) dengan pengecekan:
- Teks tombol: "batal", "cancel", "tutup", "close"
- Class: "modal-close", "btn-cancel"
- Onclick attribute yang mengandung "closest", "modal", "remove"

### 4. Immediate Close tanpa Delay
Modal langsung dihapus menggunakan `requestAnimationFrame` tanpa delay untuk mencegah double-click.

## File yang Diubah
- `public/js/edit-form-fix.js` - Upgrade ke v3.0

## Testing
Buka `/test-cancel-button-fix.html` untuk menguji perbaikan:
1. Klik tombol untuk membuka modal
2. Klik tombol "Batal" sekali
3. Modal harus langsung tertutup

## Cara Kerja
```
User klik "Batal"
       ↓
Event Capturing (fase capture)
       ↓
Cek apakah tombol cancel/close
       ↓
Ya → stopPropagation + stopImmediatePropagation
       ↓
closeModalElement() dipanggil
       ↓
Modal ditandai di WeakSet
       ↓
Modal dihapus via requestAnimationFrame
       ↓
Inline onclick TIDAK dieksekusi (sudah di-stop)
```

## Tanggal Perbaikan
11 Januari 2026
