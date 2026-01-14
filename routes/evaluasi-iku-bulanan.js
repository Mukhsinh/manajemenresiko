const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('evaluasi_iku_bulanan')
      .select(`
        *,
        indikator_kinerja_utama(
          id, indikator, satuan, pic,
          target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
          sasaran_strategi(sasaran, perspektif),
          rencana_strategis(nama_rencana, kode)
        )
      `)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ success: true, data: data || [], count: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Public endpoint
router.get('/public', async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('evaluasi_iku_bulanan')
      .select(`
        *,
        indikator_kinerja_utama(
          id, indikator, satuan, pic,
          target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
          sasaran_strategi(sasaran, perspektif),
          rencana_strategis(nama_rencana, kode)
        )
      `)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary dashboard data with accumulated yearly totals
router.get('/summary', authenticateUser, async (req, res) => {
  try {
    const { tahun } = req.query;
    const currentYear = parseInt(tahun) || new Date().getFullYear();
    const clientToUse = supabaseAdmin || supabase;

    // Get all IKU with their monthly evaluations
    let query = clientToUse
      .from('indikator_kinerja_utama')
      .select(`
        id, indikator, satuan, pic, definisi_operasional, sumber_data,
        target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
        target_nilai, baseline_nilai, baseline_tahun,
        sasaran_strategi(id, sasaran, perspektif),
        rencana_strategis(id, nama_rencana, kode, organization_id),
        evaluasi_iku_bulanan(
          id, tahun, bulan, realisasi_nilai, target_nilai, 
          persentase_capaian, keterangan, bukti_pendukung
        )
      `);

    // Apply organization filter
    if (!req.user.isSuperAdmin && req.user.organizations?.length > 0) {
      let rsQuery = clientToUse.from('rencana_strategis').select('id');
      rsQuery = buildOrganizationFilter(rsQuery, req.user);
      const { data: accessibleRS } = await rsQuery;
      const accessibleRSIds = (accessibleRS || []).map(rs => rs.id);
      if (accessibleRSIds.length > 0) {
        query = query.in('rencana_strategis_id', accessibleRSIds);
      } else {
        return res.json({ summary: {}, data: [], tahun: currentYear });
      }
    }

    const { data: ikuData, error } = await query;
    if (error) throw error;

    // Calculate summary statistics
    const summary = {
      totalIKU: ikuData?.length || 0,
      tercapai: 0,
      hampirTercapai: 0,
      dalamProses: 0,
      perluPerhatian: 0,
      belumAdaRealisasi: 0,
      rataRataCapaian: 0,
      totalRealisasi: 0,
      totalTarget: 0
    };

    let totalCapaian = 0;
    let countWithCapaian = 0;

    const processedData = (ikuData || []).map(iku => {
      // Get target for current year
      const targetField = `target_${currentYear}`;
      const targetTahunIni = parseFloat(iku[targetField]) || parseFloat(iku.target_nilai) || 0;

      // Filter evaluations for current year and calculate accumulated realization
      const evaluasiBulanan = (iku.evaluasi_iku_bulanan || [])
        .filter(e => e.tahun === currentYear)
        .sort((a, b) => a.bulan - b.bulan);

      const totalRealisasi = evaluasiBulanan.reduce((sum, e) => 
        sum + (parseFloat(e.realisasi_nilai) || 0), 0);

      // Create monthly breakdown (1-12)
      const realisasiBulanan = {};
      for (let i = 1; i <= 12; i++) {
        const evalBulan = evaluasiBulanan.find(e => e.bulan === i);
        realisasiBulanan[i] = {
          bulan: i,
          namaBulan: BULAN_NAMES[i],
          realisasi: evalBulan?.realisasi_nilai || null,
          target: evalBulan?.target_nilai || null,
          keterangan: evalBulan?.keterangan || null,
          id: evalBulan?.id || null
        };
      }

      let status = 'Belum Ada Realisasi';
      let persentase = null;

      if (totalRealisasi > 0 && targetTahunIni > 0) {
        persentase = Math.round((totalRealisasi / targetTahunIni) * 100 * 100) / 100;
        if (persentase >= 100) {
          status = 'Tercapai';
          summary.tercapai++;
        } else if (persentase >= 75) {
          status = 'Hampir Tercapai';
          summary.hampirTercapai++;
        } else if (persentase >= 50) {
          status = 'Dalam Proses';
          summary.dalamProses++;
        } else {
          status = 'Perlu Perhatian';
          summary.perluPerhatian++;
        }
        totalCapaian += persentase;
        countWithCapaian++;
        summary.totalRealisasi += totalRealisasi;
        summary.totalTarget += targetTahunIni;
      } else {
        summary.belumAdaRealisasi++;
      }

      return {
        id: iku.id,
        indikator: iku.indikator,
        satuan: iku.satuan,
        pic: iku.pic,
        definisi_operasional: iku.definisi_operasional,
        sumber_data: iku.sumber_data,
        sasaran_strategi: iku.sasaran_strategi,
        rencana_strategis: iku.rencana_strategis,
        targetTahunIni,
        totalRealisasi,
        realisasiBulanan,
        jumlahBulanTerisi: evaluasiBulanan.length,
        status,
        persentaseCapaian: persentase
      };
    });

    summary.rataRataCapaian = countWithCapaian > 0 
      ? Math.round(totalCapaian / countWithCapaian * 100) / 100 
      : 0;

    res.json({ summary, data: processedData, tahun: currentYear });
  } catch (error) {
    console.error('Evaluasi IKU Bulanan summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all monthly evaluations
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { indikator_kinerja_utama_id, tahun, bulan } = req.query;
    const clientToUse = supabaseAdmin || supabase;

    let query = clientToUse
      .from('evaluasi_iku_bulanan')
      .select(`
        *,
        indikator_kinerja_utama(
          id, indikator, satuan, pic,
          target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
          sasaran_strategi(sasaran, perspektif),
          rencana_strategis(nama_rencana, kode, organization_id)
        )
      `)
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: true });

    if (indikator_kinerja_utama_id) {
      query = query.eq('indikator_kinerja_utama_id', indikator_kinerja_utama_id);
    }
    if (tahun) {
      query = query.eq('tahun', parseInt(tahun));
    }
    if (bulan) {
      query = query.eq('bulan', parseInt(bulan));
    }

    // Apply organization filter
    if (!req.user.isSuperAdmin && req.user.organizations?.length > 0) {
      query = query.in('organization_id', req.user.organizations);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Evaluasi IKU Bulanan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('evaluasi_iku_bulanan')
      .select(`
        *,
        indikator_kinerja_utama(
          id, indikator, satuan, pic,
          target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
          sasaran_strategi(sasaran, perspektif),
          rencana_strategis(nama_rencana, kode)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update monthly realization (upsert)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      indikator_kinerja_utama_id,
      tahun,
      bulan,
      realisasi_nilai,
      target_nilai,
      keterangan,
      bukti_pendukung
    } = req.body;

    if (!indikator_kinerja_utama_id || !tahun || !bulan) {
      return res.status(400).json({ error: 'IKU, tahun, dan bulan wajib diisi' });
    }

    if (bulan < 1 || bulan > 12) {
      return res.status(400).json({ error: 'Bulan harus antara 1-12' });
    }

    const clientToUse = supabaseAdmin || supabase;

    // Get organization_id from IKU
    const { data: ikuData } = await clientToUse
      .from('indikator_kinerja_utama')
      .select('organization_id, rencana_strategis(organization_id)')
      .eq('id', indikator_kinerja_utama_id)
      .single();

    const orgId = ikuData?.organization_id || ikuData?.rencana_strategis?.organization_id;

    // Check if record exists
    const { data: existing } = await clientToUse
      .from('evaluasi_iku_bulanan')
      .select('id')
      .eq('indikator_kinerja_utama_id', indikator_kinerja_utama_id)
      .eq('tahun', parseInt(tahun))
      .eq('bulan', parseInt(bulan))
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await clientToUse
        .from('evaluasi_iku_bulanan')
        .update({
          realisasi_nilai: realisasi_nilai != null ? parseFloat(realisasi_nilai) : null,
          target_nilai: target_nilai ? parseFloat(target_nilai) : null,
          keterangan: keterangan || null,
          bukti_pendukung: bukti_pendukung || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = { message: 'Realisasi bulanan berhasil diupdate', data, isUpdate: true };
    } else {
      // Insert new
      const { data, error } = await clientToUse
        .from('evaluasi_iku_bulanan')
        .insert({
          user_id: req.user.id,
          indikator_kinerja_utama_id,
          organization_id: orgId,
          tahun: parseInt(tahun),
          bulan: parseInt(bulan),
          realisasi_nilai: realisasi_nilai != null ? parseFloat(realisasi_nilai) : null,
          target_nilai: target_nilai ? parseFloat(target_nilai) : null,
          keterangan: keterangan || null,
          bukti_pendukung: bukti_pendukung || null
        })
        .select()
        .single();

      if (error) throw error;
      result = { message: 'Realisasi bulanan berhasil ditambahkan', data, isUpdate: false };
    }

    res.json(result);
  } catch (error) {
    console.error('Create/Update evaluasi IKU bulanan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk update monthly realizations for an IKU
router.post('/bulk', authenticateUser, async (req, res) => {
  try {
    const { indikator_kinerja_utama_id, tahun, realisasi_bulanan } = req.body;

    if (!indikator_kinerja_utama_id || !tahun || !realisasi_bulanan) {
      return res.status(400).json({ error: 'IKU, tahun, dan data realisasi bulanan wajib diisi' });
    }

    const clientToUse = supabaseAdmin || supabase;

    // Get organization_id from IKU
    const { data: ikuData } = await clientToUse
      .from('indikator_kinerja_utama')
      .select('organization_id, rencana_strategis(organization_id)')
      .eq('id', indikator_kinerja_utama_id)
      .single();

    const orgId = ikuData?.organization_id || ikuData?.rencana_strategis?.organization_id;

    const results = [];
    for (const item of realisasi_bulanan) {
      if (item.bulan >= 1 && item.bulan <= 12 && item.realisasi_nilai != null) {
        // Upsert each month
        const { data, error } = await clientToUse
          .from('evaluasi_iku_bulanan')
          .upsert({
            user_id: req.user.id,
            indikator_kinerja_utama_id,
            organization_id: orgId,
            tahun: parseInt(tahun),
            bulan: parseInt(item.bulan),
            realisasi_nilai: parseFloat(item.realisasi_nilai),
            target_nilai: item.target_nilai ? parseFloat(item.target_nilai) : null,
            keterangan: item.keterangan || null,
            bukti_pendukung: item.bukti_pendukung || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'indikator_kinerja_utama_id,tahun,bulan'
          })
          .select()
          .single();

        if (!error) results.push(data);
      }
    }

    res.json({ 
      message: `${results.length} realisasi bulanan berhasil disimpan`, 
      data: results 
    });
  } catch (error) {
    console.error('Bulk update evaluasi IKU bulanan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const {
      realisasi_nilai,
      target_nilai,
      keterangan,
      bukti_pendukung
    } = req.body;

    const updateData = { updated_at: new Date().toISOString() };

    if (realisasi_nilai !== undefined) updateData.realisasi_nilai = realisasi_nilai != null ? parseFloat(realisasi_nilai) : null;
    if (target_nilai !== undefined) updateData.target_nilai = target_nilai ? parseFloat(target_nilai) : null;
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    if (bukti_pendukung !== undefined) updateData.bukti_pendukung = bukti_pendukung;

    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('evaluasi_iku_bulanan')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Realisasi bulanan berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { error } = await clientToUse
      .from('evaluasi_iku_bulanan')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Realisasi bulanan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export to Excel
router.get('/export/excel', authenticateUser, async (req, res) => {
  try {
    const { tahun } = req.query;
    const currentYear = parseInt(tahun) || new Date().getFullYear();
    const clientToUse = supabaseAdmin || supabase;

    let query = clientToUse
      .from('evaluasi_iku_bulanan')
      .select(`
        *,
        indikator_kinerja_utama(
          indikator, satuan, pic,
          sasaran_strategi(sasaran, perspektif),
          rencana_strategis(nama_rencana, kode)
        )
      `)
      .eq('tahun', currentYear)
      .order('indikator_kinerja_utama_id')
      .order('bulan');

    if (!req.user.isSuperAdmin && req.user.organizations?.length > 0) {
      query = query.in('organization_id', req.user.organizations);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Format data for export
    const exportData = (data || []).map(item => ({
      'Indikator': item.indikator_kinerja_utama?.indikator || '-',
      'Sasaran Strategi': item.indikator_kinerja_utama?.sasaran_strategi?.sasaran || '-',
      'Perspektif': item.indikator_kinerja_utama?.sasaran_strategi?.perspektif || '-',
      'Rencana Strategis': item.indikator_kinerja_utama?.rencana_strategis?.nama_rencana || '-',
      'Tahun': item.tahun,
      'Bulan': BULAN_NAMES[item.bulan],
      'Realisasi': item.realisasi_nilai,
      'Target': item.target_nilai,
      'Persentase (%)': item.persentase_capaian,
      'Satuan': item.indikator_kinerja_utama?.satuan || '-',
      'PIC': item.indikator_kinerja_utama?.pic || '-',
      'Keterangan': item.keterangan || '-'
    }));

    res.json({ 
      success: true, 
      data: exportData, 
      filename: `Evaluasi_IKU_Bulanan_${currentYear}.xlsx` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
