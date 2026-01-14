const http = require('http');

function testRoute(path, description) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`${description}: ${res.statusCode === 200 ? '✅' : '❌'} (${res.statusCode})`);
                if (res.statusCode !== 200) {
                    console.log(`   Error: ${data.substring(0, 100)}...`);
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            console.log(`${description}: ❌ (${err.message})`);
            resolve();
        });

        req.setTimeout(5000, () => {
            console.log(`${description}: ❌ (Timeout)`);
            req.destroy();
            resolve();
        });

        req.end();
    });
}

async function testAllRoutes() {
    console.log('🧪 Testing Routes...\n');
    
    await testRoute('/', 'Root route');
    await testRoute('/rencana-strategis', 'Rencana Strategis route');
    await testRoute('/risk-residual', 'Risk Residual route');
    await testRoute('/residual-risk', 'Residual Risk route');
    await testRoute('/api/reports/residual-risk/public', 'Residual Risk API');
    await testRoute('/js/residual-risk.js', 'Residual Risk JS');
    await testRoute('/css/residual-risk.css', 'Residual Risk CSS');
    
    console.log('\n🎉 Route testing completed!');
}

testAllRoutes();