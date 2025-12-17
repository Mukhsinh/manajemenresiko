const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static('public'));

// Test endpoint for rencana strategis
app.get('/api/rencana-strategis/public', async (req, res) => {
    try {
        const { supabaseAdmin } = require('./config/supabase');
        
        const { data, error } = await supabaseAdmin
            .from('rencana_strategis')
            .select('id, kode, nama_rencana, deskripsi, periode_mulai, periode_selesai, target, indikator_kinerja, status, visi_misi_id, user_id, organization_id, sasaran_strategis, indikator_kinerja_utama, created_at, updated_at, visi_misi(id, visi, misi, tahun)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`Rencana Strategis: Returning ${(data || []).length} records`);
        res.json(data || []);
    } catch (error) {
        console.error('Rencana Strategis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoint for visi misi
app.get('/api/visi-misi', async (req, res) => {
    try {
        const { supabaseAdmin } = require('./config/supabase');
        
        const { data, error } = await supabaseAdmin
            .from('visi_misi')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`Visi Misi: Returning ${(data || []).length} records`);
        res.json(data || []);
    } catch (error) {
        console.error('Visi Misi error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate kode endpoint
app.get('/api/rencana-strategis/generate/kode', (req, res) => {
    const kode = `RS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    res.json({ kode });
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log(`Test page: http://localhost:${PORT}/test-rencana-strategis-debug.html`);
});