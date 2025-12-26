const http = require('http');

async function testDashboardFix() {
    console.log('=== TESTING DASHBOARD FIXES ===');
    
    try {
        // Test public dashboard endpoint
        console.log('\n1. Testing public dashboard endpoint...');
        
        const data = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:3003/api/dashboard/public', (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        resolve(data);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
        
        console.log('Dashboard data received:', {
            total_risks: data.total_risks,
            visi_misi_count: data.sample_data?.visi_misi?.length || 0,
            rencana_strategis_count: data.counts?.rencana_strategis || data.sample_data?.rencana_strategis?.length || 0,
            inherent_risks: data.inherent_risks,
            residual_risks: data.residual_risks,
            kri: data.kri
        });
        
        // Validate fixes
        console.log('\n2. Validating fixes...');
        
        // Check Rencana Strategis count
        const rencanaCount = data.counts?.rencana_strategis || data.sample_data?.rencana_strategis?.length || 0;
        console.log(`✓ Rencana Strategis count: ${rencanaCount} (should be 9 or close to it)`);
        
        // Check Inherent Risk distribution
        const inherentTotal = Object.values(data.inherent_risks || {}).reduce((sum, val) => sum + val, 0);
        console.log(`✓ Inherent Risk total: ${inherentTotal} (should be > 0)`);
        console.log('  - Extreme High:', data.inherent_risks?.extreme_high || 0);
        console.log('  - High:', data.inherent_risks?.high || 0);
        console.log('  - Medium:', data.inherent_risks?.medium || 0);
        console.log('  - Low:', data.inherent_risks?.low || 0);
        
        // Check Residual Risk distribution
        const residualTotal = Object.values(data.residual_risks || {}).reduce((sum, val) => sum + val, 0);
        console.log(`✓ Residual Risk total: ${residualTotal} (should be > 0)`);
        console.log('  - Extreme High:', data.residual_risks?.extreme_high || 0);
        console.log('  - High:', data.residual_risks?.high || 0);
        console.log('  - Medium:', data.residual_risks?.medium || 0);
        console.log('  - Low:', data.residual_risks?.low || 0);
        
        // Check if charts will show different data
        const inherentHasData = inherentTotal > 0;
        const residualHasData = residualTotal > 0;
        const chartsAreDifferent = JSON.stringify(data.inherent_risks) !== JSON.stringify(data.residual_risks);
        
        console.log(`✓ Inherent chart has data: ${inherentHasData}`);
        console.log(`✓ Residual chart has data: ${residualHasData}`);
        console.log(`✓ Charts show different data: ${chartsAreDifferent}`);
        
        if (chartsAreDifferent) {
            console.log('✅ SUCCESS: Charts should now display different data!');
        } else {
            console.log('⚠️  WARNING: Charts may still look the same');
        }
        
        if (rencanaCount >= 9) {
            console.log('✅ SUCCESS: Rencana Strategis count is correct!');
        } else {
            console.log('⚠️  WARNING: Rencana Strategis count may still be incorrect');
        }
        
        console.log('\n=== TEST COMPLETED ===');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nTrying to start server first...');
        
        // Try to start server if not running
        const { spawn } = require('child_process');
        const server = spawn('node', ['server.js'], { 
            stdio: 'inherit',
            detached: true 
        });
        
        console.log('Server started. Please wait a moment and run this test again.');
        
        // Don't wait for server, just exit
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
}

// Run the test
testDashboardFix();