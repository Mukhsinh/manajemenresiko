const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { buildOrganizationFilter } = require('../utils/organization');

// Debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('evaluasi_iku')
      .select(`
        *,
        indikator_kinerja_utama(
          id, indikator, satuan, pic,
          target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
          sasaran_strategi(sasaran, perspektif),
          rencana_strategis(nama_rencana, kode)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

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
      .from('evaluasi_iku')
      .select(`
        *,
        indikator_kinerja_utama(
          id, indikator, satuan, pic,
          target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
          sasaran_strategi(sasaran, perspektif),
          rencana_strategis(nama_rencana, kode)
        )
      `)
      .order('tahun', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary/dashboard data
router.get('/summary', authenticateUser, async (req, res) => {
  try {
    const { tahun } = req.query;
    const currentYear = tahun || new Date().getFullYear();
    const clientToUse = supabaseAdmin || supabase;

    // Get all IKU with their evaluations for the year
    let query = clientToUse
      .from('indikator_kinerja_utama')
      .select(`
        id, indikator, satuan, pic,
        target_2025, target_2026, target_2027, target_2028, target_2029, target_2030,
        sasaran_strategi(sasaran, perspektif),
        rencana_strategis(nama_rencana, kode, organization_id),
        evaluasi_iku(
          id, tahun, periode, realisasi_nilai, target_nilai, 
          persentase_capaian, status_capaian, keterangan
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
        return res.json({ summary: {}, data: [] });
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
      rataRataCapaian: 0
    };

    let totalCapaian = 0;
    let countWithCapaian = 0;

    const processedData = (ikuData || []).map(iku => {
      // Get target for current year
      const targetField = `target_${currentYear}`;
      const targetTahunIni = iku[targetField] || iku.target_nilai;

      // Get latest evaluation for current year
      const evaluasiTahunIni = (iku.evaluasi_iku || [])
        .filter(e => e.tahun === parseInt(currentYear))
        .sort((a, b) => {
          const periodeOrder = { 'TW4': 4, 'TW3': 3, 'TW2': 2, 'TW1': 1, 'Tahunan': 5 };
          return (periodeOrder[b.periode] || 0) - (periodeOrder[a.periode] || 0);
        })[0];

      let status = 'Belum Ada Realisasi';
      let persentase = null;

      if (evaluasiTahunIni?.realisasi_nilai != null && targetTahunIni) {
        persentase = (evaluasiTahunIni.realisasi_nilai / targetTahunIni) * 100;
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
      } else {
        summary.belumAdaRealisasi++;
      }

      return {
        ...iku,
        targetTahunIni,
        evaluasiTahunIni,
        status,
        persentaseCapaian: persentase
      };
    });

    summary.rataRataCapaian = countWithCapaian > 0 
      ? Math.round(totalCapaian / countWithCapaian * 100) / 100 
      : 0;

    res.json({ summary, data: processedData, tahun: currentYear });
  } catch (error) {
    console.error('Evaluasi IKU summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all evaluasi
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { indikator_kinerja_utama_id, tahun, periode } = req.query;
    const clientToUse = supabaseAdmin || supabase;

    let query = clientToUse
      .from('evaluasi_iku')
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
      .order('created_at', { ascending: false });

    if (indikator_kinerja_utama_id) {
      query = query.eq('indikator_kinerja_utama_id', indikator_kinerja_utama_id);
    }
    if (tahun) {
      query = query.eq('tahun', parseInt(tahun));
    }
    if (periode) {
      query = query.eq('periode', periode);
    }

    // Apply organization filter
    if (!req.user.isSuperAdmin && req.user.organizations?.length > 0) {
      query = query.in('organization_id', req.user.organizations);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Evaluasi IKU error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('evaluasi_iku')
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

// Create
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      indikator_kinerja_utama_id,
      tahun,
      periode,
      realisasi_nilai,
      target_nilai,
      keterangan,
      bukti_pendukung,
      evaluator
    } = req.body;

    if (!indikator_kinerja_utama_id || !tahun) {
      return res.status(400).json({ error: 'IKU dan tahun wajib diisi' });
    }

    // Get organization_id from IKU
    const clientToUse = supabaseAdmin || supabase;
    const { data: ikuData } = await clientToUse
      .from('indikator_kinerja_utama')
      .select('organization_id, rencana_strategis(organization_id)')
      .eq('id', indikator_kinerja_utama_id)
      .single();

    const orgId = ikuData?.organization_id || ikuData?.rencana_strategis?.organization_id;

    // Calculate persentase_capaian and status
    let persentase_capaian = null;
    let status_capaian = 'Belum Ada Realisasi';
    
    if (realisasi_nilai != null && target_nilai && target_nilai !== 0) {
      persentase_capaian = Math.round((realisasi_nilai / target_nilai) * 100 * 100) / 100;
      if (persentase_capaian >= 100) status_capaian = 'Tercapai';
      else if (persentase_capaian >= 75) status_capaian = 'Hampir Tercapai';
      else if (persentase_capaian >= 50) status_capaian = 'Dalam Proses';
      else status_capaian = 'Perlu Perhatian';
    }

    const { data, error } = await clientToUse
      .from('evaluasi_iku')
      .insert({
        user_id: req.user.id,
        indikator_kinerja_utama_id,
        organization_id: orgId,
        tahun: parseInt(tahun),
        periode: periode || 'Tahunan',
        realisasi_nilai: realisasi_nilai != null ? parseFloat(realisasi_nilai) : null,
        target_nilai: target_nilai ? parseFloat(target_nilai) : null,
        persentase_capaian,
        status_capaian,
        keterangan: keterangan || null,
        bukti_pendukung: bukti_pendukung || null,
        evaluator: evaluator || req.user.email,
        tanggal_evaluasi: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Evaluasi IKU berhasil ditambahkan', data });
  } catch (error) {
    console.error('Create evaluasi IKU error:', error);
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
      bukti_pendukung,
      evaluator,
      periode
    } = req.body;

    const updateData = { updated_at: new Date().toISOString() };

    if (periode !== undefined) updateData.periode = periode;
    if (realisasi_nilai !== undefined) updateData.realisasi_nilai = realisasi_nilai != null ? parseFloat(realisasi_nilai) : null;
    if (target_nilai !== undefined) updateData.target_nilai = target_nilai ? parseFloat(target_nilai) : null;
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    if (bukti_pendukung !== undefined) updateData.bukti_pendukung = bukti_pendukung;
    if (evaluator !== undefined) updateData.evaluator = evaluator;

    // Recalculate persentase and status
    const realVal = updateData.realisasi_nilai !== undefined ? updateData.realisasi_nilai : null;
    const targVal = updateData.target_nilai !== undefined ? updateData.target_nilai : null;
    
    if (realVal != null && targVal && targVal !== 0) {
      updateData.persentase_capaian = Math.round((realVal / targVal) * 100 * 100) / 100;
      if (updateData.persentase_capaian >= 100) updateData.status_capaian = 'Tercapai';
      else if (updateData.persentase_capaian >= 75) updateData.status_capaian = 'Hampir Tercapai';
      else if (updateData.persentase_capaian >= 50) updateData.status_capaian = 'Dalam Proses';
      else updateData.status_capaian = 'Perlu Perhatian';
    }

    const clientToUse = supabaseAdmin || supabase;
    const { data, error } = await clientToUse
      .from('evaluasi_iku')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ message: 'Evaluasi IKU berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { error } = await clientToUse
      .from('evaluasi_iku')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Evaluasi IKU berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
