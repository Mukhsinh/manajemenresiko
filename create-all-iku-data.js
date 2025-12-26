// Script untuk membuat semua data IKU secara batch
// Saya akan mengambil semua sasaran strategi dan membuat IKU untuk masing-masing

const queries = [
  // RS-2025-004 (Program Inovasi Layanan Berkelanjutan)
  `-- Ambil sasaran strategi untuk RS-2025-004
  SELECT ss.id, ss.perspektif, rs.nama_rencana 
  FROM sasaran_strategi ss 
  JOIN rencana_strategis rs ON ss.rencana_strategis_id = rs.id 
  WHERE rs.nama_rencana = 'Program Inovasi Layanan Berkelanjutan' 
  ORDER BY ss.perspektif;`,

  // RS-2025-001 (Peningkatan Sistem Keselamatan Pasien Terintegrasi)
  `-- Ambil sasaran strategi untuk RS-2025-001
  SELECT ss.id, ss.perspektif, rs.nama_rencana 
  FROM sasaran_strategi ss 
  JOIN rencana_strategis rs ON ss.rencana_strategis_id = rs.id 
  WHERE rs.nama_rencana = 'Peningkatan Sistem Keselamatan Pasien Terintegrasi' 
  ORDER BY ss.perspektif;`
];

console.log('Queries untuk mengambil sasaran strategi:');
queries.forEach((query, index) => {
  console.log(`\nQuery ${index + 1}:`);
  console.log(query);
});