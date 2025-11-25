// Utility untuk generate kode otomatis
const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Generate kode otomatis berdasarkan format
 * Format: {PREFIX}-{YYYY}-{MM}-{NO}
 */
async function generateKode(tableName, prefix, userId) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Use admin client to bypass RLS and get accurate count globally
    const clientToUse = supabaseAdmin || supabase;
    
    // Cari kode terakhir di bulan ini (global, tidak hanya per user)
    const { data: lastRecords, error } = await clientToUse
      .from(tableName)
      .select('kode')
      .like('kode', `${prefix}-${year}-${month}-%`)
      .order('kode', { ascending: false })
      .limit(1);

    let nextNo = 1;
    if (!error && lastRecords && lastRecords.length > 0) {
      const lastRecord = lastRecords[0];
      const parts = lastRecord.kode.split('-');
      if (parts.length === 4) {
        const lastNo = parseInt(parts[3]) || 0;
        nextNo = lastNo + 1;
      }
    }

    // Check if code already exists and retry with incremented number
    let attempts = 0;
    let kode = '';
    while (attempts < 10) {
      kode = `${prefix}-${year}-${month}-${String(nextNo + attempts).padStart(4, '0')}`;
      
      // Check if this code already exists
      const { data: existing } = await clientToUse
        .from(tableName)
        .select('kode')
        .eq('kode', kode)
        .maybeSingle();
      
      if (!existing) {
        // Code is unique, break the loop
        break;
      }
      
      attempts++;
    }

    return kode;
  } catch (error) {
    console.error('Error generating code:', error);
    // Fallback jika error - use timestamp for uniqueness
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${year}-${month}-${timestamp}`;
  }
}

/**
 * Generate kode untuk rencana strategis
 */
async function generateKodeRencanaStrategis(userId) {
  return generateKode('rencana_strategis', 'RS', userId);
}

/**
 * Generate kode untuk peluang
 */
async function generateKodePeluang(userId) {
  return generateKode('peluang', 'OPP', userId);
}

/**
 * Generate kode untuk KRI
 */
async function generateKodeKRI(userId) {
  return generateKode('key_risk_indicator', 'KRI', userId);
}

/**
 * Generate kode untuk Loss Event
 */
async function generateKodeLossEvent(userId) {
  return generateKode('loss_event', 'LOSS', userId);
}

/**
 * Generate kode untuk EWS
 */
async function generateKodeEWS(userId) {
  return generateKode('early_warning_system', 'EWS', userId);
}

/**
 * Generate kode untuk Pengajuan Risiko
 */
async function generateKodePengajuanRisiko(userId) {
  return generateKode('pengajuan_risiko', 'REQ', userId);
}

module.exports = {
  generateKode,
  generateKodeRencanaStrategis,
  generateKodePeluang,
  generateKodeKRI,
  generateKodeLossEvent,
  generateKodeEWS,
  generateKodePengajuanRisiko
};

