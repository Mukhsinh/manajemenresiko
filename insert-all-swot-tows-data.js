// Script untuk insert semua data SWOT TOWS strategi secara batch
const insertQueries = [
  // RS-2025-004 (Program Inovasi Layanan Berkelanjutan)
  `INSERT INTO swot_tows_strategi (user_id, rencana_strategis_id, tahun, tipe_strategi, strategi, organization_id) VALUES
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'SO', 'Mengoptimalkan keunggulan tim riset medis untuk mengembangkan inovasi teknologi kesehatan berbasis evidence-based practice', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'SO', 'Memanfaatkan sistem manajemen penelitian untuk mengembangkan kolaborasi riset internasional dan publikasi berkualitas tinggi', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'WO', 'Mengatasi keterbatasan funding riset dengan memanfaatkan peluang grant internasional dan kerjasama industri', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'WO', 'Memperbaiki infrastruktur penelitian melalui adopsi teknologi digital dan platform riset cloud-based', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'ST', 'Menggunakan keunggulan komite etik penelitian untuk menghadapi tantangan regulasi dan compliance riset', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'ST', 'Memanfaatkan sistem quality control riset untuk mitigasi risiko plagiarisme dan research misconduct', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'WT', 'Meminimalkan kelemahan kapasitas riset dengan fokus pada penelitian unggulan dan high-impact studies', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', '716eb8ed-f56e-4f59-9270-e5c2c140734a', 2025, 'WT', 'Mengurangi risiko research failure melalui systematic literature review dan pilot study methodology', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7');`,

  // RS-2025-006 (Program Pengembangan SDM Berkelanjutan)
  `INSERT INTO swot_tows_strategi (user_id, rencana_strategis_id, tahun, tipe_strategi, strategi, organization_id) VALUES
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'SO', 'Mengoptimalkan keunggulan sistem manajemen talenta untuk mengembangkan program succession planning dan leadership development', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'SO', 'Memanfaatkan budaya pembelajaran organisasi untuk mengembangkan competency-based training dan certification program', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'WO', 'Mengatasi keterbatasan budget pelatihan dengan memanfaatkan platform e-learning dan microlearning technology', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'WO', 'Memperbaiki sistem reward dan punishment melalui implementasi performance-based incentive dan recognition program', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'ST', 'Menggunakan keunggulan sistem sertifikasi kompetensi untuk menghadapi tantangan turnover dan brain drain', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'ST', 'Memanfaatkan sistem employee engagement untuk mitigasi risiko workplace conflict dan job dissatisfaction', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'WT', 'Meminimalkan kelemahan dalam career development dengan program mentoring dan coaching yang terstruktur', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'fdb02867-fa72-423f-b7a0-a9ffe6f20fa4', 2025, 'WT', 'Mengurangi risiko skill gap melalui continuous skills assessment dan targeted training program', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7');`,

  // RS-2025-002 (Sistem Manajemen Keuangan Terintegrasi)
  `INSERT INTO swot_tows_strategi (user_id, rencana_strategis_id, tahun, tipe_strategi, strategi, organization_id) VALUES
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'SO', 'Mengoptimalkan keunggulan sistem ERP untuk mengembangkan advanced analytics dan predictive financial modeling', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'SO', 'Memanfaatkan sistem cost accounting untuk mengembangkan value-based healthcare dan outcome-based pricing', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'WO', 'Mengatasi keterbatasan cash flow dengan memanfaatkan fintech solutions dan alternative financing options', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'WO', 'Memperbaiki sistem inventory management melalui implementasi AI-driven supply chain optimization', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'ST', 'Menggunakan keunggulan sistem audit internal untuk menghadapi tantangan regulatory compliance dan fraud risk', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'ST', 'Memanfaatkan sistem financial controls untuk mitigasi risiko cyber security dan data breach', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'WT', 'Meminimalkan kelemahan dalam budget planning dengan implementasi zero-based budgeting dan scenario planning', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7'),
  ('cc39ee53-4006-4b55-b383-a1ec5c40e676', 'd46e9c2b-afaf-413b-a688-65d5e0a40b98', 2025, 'WT', 'Mengurangi risiko financial loss melalui comprehensive risk assessment dan insurance coverage optimization', 'e5a31a3d-7b84-4c32-9b63-0b40d6e1f0e7');`
];

console.log('Queries to execute:');
insertQueries.forEach((query, index) => {
  console.log(`Query ${index + 1}:`);
  console.log(query);
  console.log('\n---\n');
});