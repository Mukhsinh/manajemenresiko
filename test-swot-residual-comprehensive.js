const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data untuk login
const testUser = {
    email: 'superadmin@example.com',
    password: 'superadmin123'
};

async function testLogin() {
    try {
        console.log('🔐 Testing login...');
        const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
        
        if (response.data.success && response.data.token) {
            console.log('✅ Login successful');
            return response.data.token;
        } else {
            console.log('❌ Login failed:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Login error:', error.message);
        return null;
    }
}

async function testAnalisisSwot(token) {
    console.log('\n📊 Testing Analisis SWOT...');
    
    try {
        // Test GET analisis-swot
        const response = await axios.get(`${BASE_URL}/api/analisis-swot`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Analisis SWOT API accessible');
        console.log('📋 Data count:', response.data.data?.length || 0);
        
        // Test specific issues
        if (response.data.data && response.data.data.length > 0) {
            const sample = response.data.data[0];
            console.log('📝 Sample data structure:', {
                id: sample.id,
                faktor: sample.faktor,
                bobot: sample.bobot,
                rating: sample.rating,
                skor: sample.skor
            });
            
            // Check for common issues
            const issues = [];
            
            // Check bobot total
            const totalBobot = response.data.data.reduce((sum, item) => sum + (item.bobot || 0), 0);
            if (Math.abs(totalBobot - 100) > 0.01) {
                issues.push(`Total bobot tidak 100% (${totalBobot}%)`);
            }
            
            // Check for zero scores
            const zeroScores = response.data.data.filter(item => item.skor === 0 || item.skor === null);
            if (zeroScores.length > 0) {
                issues.push(`${zeroScores.length} item dengan skor 0 atau null`);
            }
            
            // Check for missing data
            const missingData = response.data.data.filter(item => 
                !item.faktor || item.bobot === null || item.rating === null
            );
            if (missingData.length > 0) {
                issues.push(`${missingData.length} item dengan data tidak lengkap`);
            }
            
            if (issues.length > 0) {
                console.log('⚠️  Issues found:');
                issues.forEach(issue => console.log(`   - ${issue}`));
            } else {
                console.log('✅ No data issues found');
            }
        }
        
        return true;
    } catch (error) {
        console.log('❌ Analisis SWOT error:', error.response?.data || error.message);
        return false;
    }
}

async function testRiskResidual(token) {
    console.log('\n🎯 Testing Risk Residual...');
    
    try {
        // Test GET residual risk
        const response = await axios.get(`${BASE_URL}/api/residual-risk`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Risk Residual API accessible');
        console.log('📋 Data count:', response.data.data?.length || 0);
        
        if (response.data.data && response.data.data.length > 0) {
            const sample = response.data.data[0];
            console.log('📝 Sample data structure:', {
                id: sample.id,
                risk_event: sample.risk_event,
                inherent_likelihood: sample.inherent_likelihood,
                inherent_impact: sample.inherent_impact,
                residual_likelihood: sample.residual_likelihood,
                residual_impact: sample.residual_impact
            });
            
            // Check for common issues
            const issues = [];
            
            // Check for missing risk events
            const missingEvents = response.data.data.filter(item => !item.risk_event);
            if (missingEvents.length > 0) {
                issues.push(`${missingEvents.length} item tanpa risk_event`);
            }
            
            // Check for invalid likelihood/impact values
            const invalidValues = response.data.data.filter(item => 
                item.inherent_likelihood < 1 || item.inherent_likelihood > 5 ||
                item.inherent_impact < 1 || item.inherent_impact > 5 ||
                item.residual_likelihood < 1 || item.residual_likelihood > 5 ||
                item.residual_impact < 1 || item.residual_impact > 5
            );
            if (invalidValues.length > 0) {
                issues.push(`${invalidValues.length} item dengan nilai likelihood/impact tidak valid`);
            }
            
            // Check for missing residual values
            const missingResidual = response.data.data.filter(item => 
                !item.residual_likelihood || !item.residual_impact
            );
            if (missingResidual.length > 0) {
                issues.push(`${missingResidual.length} item tanpa nilai residual`);
            }
            
            if (issues.length > 0) {
                console.log('⚠️  Issues found:');
                issues.forEach(issue => console.log(`   - ${issue}`));
            } else {
                console.log('✅ No data issues found');
            }
        }
        
        return true;
    } catch (error) {
        console.log('❌ Risk Residual error:', error.response?.data || error.message);
        return false;
    }
}

async function testFrontendPages() {
    console.log('\n🌐 Testing Frontend Pages...');
    
    try {
        // Test analisis-swot page
        const swotResponse = await axios.get(`${BASE_URL}/analisis-swot`);
        console.log('✅ Analisis SWOT page accessible');
        
        // Test residual-risk page
        const residualResponse = await axios.get(`${BASE_URL}/residual-risk`);
        console.log('✅ Risk Residual page accessible');
        
        return true;
    } catch (error) {
        console.log('❌ Frontend pages error:', error.message);
        return false;
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting comprehensive test for SWOT and Risk Residual...\n');
    
    // Test login
    const token = await testLogin();
    if (!token) {
        console.log('❌ Cannot proceed without valid token');
        return;
    }
    
    // Test APIs
    const swotResult = await testAnalisisSwot(token);
    const residualResult = await testRiskResidual(token);
    
    // Test frontend
    const frontendResult = await testFrontendPages();
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Login: ${token ? '✅' : '❌'}`);
    console.log(`   Analisis SWOT: ${swotResult ? '✅' : '❌'}`);
    console.log(`   Risk Residual: ${residualResult ? '✅' : '❌'}`);
    console.log(`   Frontend Pages: ${frontendResult ? '✅' : '❌'}`);
    
    const allPassed = token && swotResult && residualResult && frontendResult;
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Status: ${allPassed ? 'PASSED' : 'NEEDS FIXES'}`);
}

// Run the test
runComprehensiveTest().catch(console.error);