const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const { exportToExcel, generateTemplate } = require('../utils/exportHelper');

async function generateWorkUnitCode() {
  const { data, error } = await supabase
    .from('master_work_units')
    .select('code')
    .ilike('code', 'UK%')
    .order('code', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Generate code error:', error);
    return `UK${String(Date.now()).slice(-3)}`;
  }

  if (!data || !data.code) {
    return 'UK001';
  }

  const match = data.code.match(/UK(\d+)/i);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `UK${String(next).padStart(3, '0')}`;
}

function sendExcelResponse(res, buffer, filename) {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.send(buffer);
}

// Probability Criteria
router.get('/probability-criteria', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_probability_criteria')
      .select('*')
      .order('index', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/probability-criteria', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_probability_criteria')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/probability-criteria/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_probability_criteria')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/probability-criteria/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('master_probability_criteria')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Impact Criteria
router.get('/impact-criteria', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_impact_criteria')
      .select('*')
      .order('index', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/impact-criteria', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_impact_criteria')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/impact-criteria/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_impact_criteria')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/impact-criteria/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('master_impact_criteria')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Risk Categories
router.get('/risk-categories', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_risk_categories')
      .select('*')
      .order('id');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/risk-categories', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_risk_categories')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/risk-categories/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_risk_categories')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/risk-categories/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('master_risk_categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Work Units
router.get('/work-units', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_work_units')
      .select('*, organizations(name, code)')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/work-units', authenticateUser, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.code) {
      payload.code = await generateWorkUnitCode();
    }
    const { data, error } = await supabase
      .from('master_work_units')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/work-units/:id', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_work_units')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/work-units/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('master_work_units')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Work unit code generator
router.get('/work-units/generate-code', authenticateUser, async (req, res) => {
  try {
    const code = await generateWorkUnitCode();
    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Risk Appetite
router.get('/risk-appetite', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('risk_appetite')
      .select(`
        *,
        risk_inputs(kode_risiko, sasaran)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/risk-appetite', authenticateUser, async (req, res) => {
  try {
    const appetiteData = {
      ...req.body,
      user_id: req.user.id
    };

    const { data, error } = await supabase
      .from('risk_appetite')
      .upsert(appetiteData, { onConflict: 'risk_input_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to normalize import data
function normalizeItem(item = {}, map = {}) {
  const normalized = {};
  Object.entries(map).forEach(([key, aliases]) => {
    const found = aliases.find(alias => item[alias] !== undefined && item[alias] !== '');
    if (found !== undefined) {
      normalized[key] = item[found];
    }
  });
  return normalized;
}

async function handleTemplateResponse(res, headers, sheetName, filename) {
  const buffer = generateTemplate(headers, sheetName);
  sendExcelResponse(res, buffer, filename);
}

async function handleExportResponse(res, table, sheetName, filename, select = '*') {
  const { data, error } = await supabase.from(table).select(select);
  if (error) throw error;
  const buffer = exportToExcel(data || [], sheetName);
  sendExcelResponse(res, buffer, filename);
}

async function handleImport(table, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Data import tidak valid');
  }
  const sanitized = items.filter(item => Object.keys(item).length > 0);
  if (sanitized.length === 0) {
    throw new Error('Data import tidak valid');
  }
  const { data, error } = await supabase.from(table).upsert(sanitized);
  if (error) throw error;
  return data;
}

// Probability criteria template/export/import
router.get('/probability-criteria/template', authenticateUser, async (req, res) => {
  try {
    await handleTemplateResponse(
      res,
      ['index', 'probability', 'description', 'percentage'],
      'Probability Criteria',
      'template-kriteria-probabilitas.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/probability-criteria/export', authenticateUser, async (req, res) => {
  try {
    await handleExportResponse(
      res,
      'master_probability_criteria',
      'Probability Criteria',
      'kriteria-probabilitas.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/probability-criteria/import', authenticateUser, async (req, res) => {
  try {
    const items = (req.body.items || []).map(item =>
      normalizeItem(item, {
        index: ['index', 'Index'],
        probability: ['probability', 'Probabilitas'],
        description: ['description', 'Deskripsi'],
        percentage: ['percentage', 'Persentase']
      })
    );
    await handleImport('master_probability_criteria', items);
    res.json({ message: 'Import berhasil' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Impact criteria template/export/import
router.get('/impact-criteria/template', authenticateUser, async (req, res) => {
  try {
    await handleTemplateResponse(
      res,
      ['index', 'impact', 'description'],
      'Impact Criteria',
      'template-kriteria-dampak.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/impact-criteria/export', authenticateUser, async (req, res) => {
  try {
    await handleExportResponse(
      res,
      'master_impact_criteria',
      'Impact Criteria',
      'kriteria-dampak.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/impact-criteria/import', authenticateUser, async (req, res) => {
  try {
    const items = (req.body.items || []).map(item =>
      normalizeItem(item, {
        index: ['index', 'Index'],
        impact: ['impact', 'Dampak'],
        description: ['description', 'Deskripsi']
      })
    );
    await handleImport('master_impact_criteria', items);
    res.json({ message: 'Import berhasil' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Risk categories template/export/import
router.get('/risk-categories/template', authenticateUser, async (req, res) => {
  try {
    await handleTemplateResponse(
      res,
      ['name', 'definition'],
      'Risk Categories',
      'template-kategori-risiko.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/risk-categories/export', authenticateUser, async (req, res) => {
  try {
    await handleExportResponse(
      res,
      'master_risk_categories',
      'Risk Categories',
      'kategori-risiko.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/risk-categories/import', authenticateUser, async (req, res) => {
  try {
    const items = (req.body.items || []).map(item =>
      normalizeItem(item, {
        name: ['name', 'Nama'],
        definition: ['definition', 'Definisi']
      })
    );
    await handleImport('master_risk_categories', items);
    res.json({ message: 'Import berhasil' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Work units template/export/import
router.get('/work-units/template', authenticateUser, async (req, res) => {
  try {
    await handleTemplateResponse(
      res,
      ['name', 'code', 'organization_code', 'manager_name', 'manager_email'],
      'Unit Kerja',
      'template-unit-kerja.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/work-units/export', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('master_work_units')
      .select('*, organizations(name, code)')
      .order('name');

    if (error) throw error;

    const formatted = (data || []).map(item => ({
      nama_unit_kerja: item.name,
      kode_unit_kerja: item.code,
      organisasi: item.organizations?.name || '',
      kode_organisasi: item.organizations?.code || '',
      nama_manajer: item.manager_name || '',
      email_manajer: item.manager_email || ''
    }));

    const buffer = exportToExcel(formatted, 'Unit Kerja');
    sendExcelResponse(res, buffer, 'unit-kerja.xlsx');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/work-units/import', authenticateUser, async (req, res) => {
  try {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, code');

    const items = req.body.items || [];
    const payload = [];

    for (const item of items) {
      const normalized = normalizeItem(item, {
        name: ['name', 'Nama', 'Nama Unit Kerja'],
        code: ['code', 'Kode', 'Kode Unit Kerja'],
        organization_code: ['organization_code', 'Kode Organisasi', 'Org Code', 'Organization Code'],
        organization_name: ['organization_name', 'Nama Organisasi'],
        manager_name: ['manager_name', 'Nama Manajer'],
        manager_email: ['manager_email', 'Email Manajer']
      });

      if (!normalized.code) {
        normalized.code = await generateWorkUnitCode();
      }

      if (!normalized.organization_id) {
        const org =
          orgs?.find(o => o.code === normalized.organization_code) ||
          orgs?.find(o => o.name === normalized.organization_name);
        if (org) {
          normalized.organization_id = org.id;
        }
      }

      delete normalized.organization_code;
      delete normalized.organization_name;

      payload.push(normalized);
    }

    await handleImport('master_work_units', payload);
    res.json({ message: 'Import berhasil' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


