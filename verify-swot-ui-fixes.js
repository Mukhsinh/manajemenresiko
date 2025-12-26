const fs = require('fs');
const path = require('path');

function verifySwotUIFixes() {
  console.log('🔍 Memverifikasi perbaikan UI SWOT Analisis...\n');
  
  const filesToCheck = [
    'public/js/analisis-swot.js',
    'public/js/analisis-swot-enhanced.js'
  ];
  
  const fixes = [
    {
      name: 'Hapus "Analisis SWOT Enhanced"',
      pattern: /Analisis SWOT Enhanced/g,
      shouldNotExist: true
    },
    {
      name: 'Hapus teks korelasi rencana strategis',
      pattern: /Analisis SWOT dengan korelasi rencana strategis/g,
      shouldNotExist: true
    },
    {
      name: 'Hapus label form filter',
      pattern: /<label class="form-label">/g,
      shouldNotExist: true
    },
    {
      name: 'Hapus teks "Setiap perspektif memiliki 5 data"',
      pattern: /Setiap perspektif memiliki 5 data/g,
      shouldNotExist: true
    },
    {
      name: 'Ubah "Kategori" menjadi "Perspektif"',
      pattern: /<th[^>]*>Perspektif<\/th>/g,
      shouldExist: true
    },
    {
      name: 'Badge dengan class kategori-column',
      pattern: /kategori-column/g,
      shouldExist: true
    },
    {
      name: 'CSS untuk badge overflow fix',
      pattern: /max-width.*badge/g,
      shouldExist: true
    }
  ];
  
  let allPassed = true;
  
  filesToCheck.forEach(filePath => {
    console.log(`📁 Memeriksa file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File tidak ditemukan: ${filePath}`);
      allPassed = false;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    fixes.forEach(fix => {
      const matches = content.match(fix.pattern);
      const hasMatches = matches && matches.length > 0;
      
      if (fix.shouldNotExist && hasMatches) {
        console.log(`❌ ${fix.name}: Masih ditemukan (${matches.length} kali)`);
        allPassed = false;
      } else if (fix.shouldExist && !hasMatches) {
        console.log(`❌ ${fix.name}: Tidak ditemukan`);
        allPassed = false;
      } else if (fix.shouldNotExist && !hasMatches) {
        console.log(`✅ ${fix.name}: Berhasil dihapus`);
      } else if (fix.shouldExist && hasMatches) {
        console.log(`✅ ${fix.name}: Ditemukan (${matches.length} kali)`);
      }
    });
    
    console.log('');
  });
  
  // Check CSS file
  const cssFile = 'public/css/analisis-swot-fixed.css';
  console.log(`📁 Memeriksa file CSS: ${cssFile}`);
  
  if (fs.existsSync(cssFile)) {
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    
    const cssChecks = [
      { name: 'Badge max-width', pattern: /\.badge.*max-width/g },
      { name: 'Kategori column width', pattern: /\.kategori-column/g },
      { name: 'Responsive badge', pattern: /@media.*badge/g }
    ];
    
    cssChecks.forEach(check => {
      const matches = cssContent.match(check.pattern);
      if (matches && matches.length > 0) {
        console.log(`✅ ${check.name}: Ditemukan`);
      } else {
        console.log(`❌ ${check.name}: Tidak ditemukan`);
        allPassed = false;
      }
    });
  } else {
    console.log(`❌ File CSS tidak ditemukan: ${cssFile}`);
    allPassed = false;
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 SEMUA PERBAIKAN UI BERHASIL DITERAPKAN!');
    console.log('\n📋 Ringkasan perbaikan:');
    console.log('✅ Teks berlebihan dihapus');
    console.log('✅ Label filter dihapus');
    console.log('✅ "Kategori" diubah menjadi "Perspektif"');
    console.log('✅ Badge overflow diperbaiki');
    console.log('✅ CSS responsive ditambahkan');
    
    console.log('\n🚀 Langkah selanjutnya:');
    console.log('1. Refresh browser (Ctrl+F5)');
    console.log('2. Clear browser cache');
    console.log('3. Pastikan menggunakan file JS yang benar');
  } else {
    console.log('❌ MASIH ADA PERBAIKAN YANG BELUM DITERAPKAN');
    console.log('\n🔧 Periksa file-file di atas dan pastikan semua perbaikan sudah benar');
  }
}

// Jalankan verifikasi
verifySwotUIFixes();