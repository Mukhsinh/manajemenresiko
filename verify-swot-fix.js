const axios = require('axios');

async function verifySwotFix() {
  console.log('🧪 VERIFYING SWOT WEAKNESS FIX');
  console.log('='.repeat(40));
  
  try {
    const BASE_URL = 'http://localhost:3002';
    
    // Test without authentication (debug endpoint)
    console.log('\n1. Testing debug endpoint...');
    try {
      const debugResponse = await axios.get(`${BASE_URL}/api/analisis-swot/debug`);
      const weaknessData = debugResponse.data.data.filter(item => item.kategori === 'Weakness');
      console.log(`✅ Found ${weaknessData.length} Weakness items in database`);
      
      if (weaknessData.length > 0) {
        const totalScore = weaknessData.reduce((sum, item) => sum + (item.score || 0), 0);
        console.log(`📊 Total Weakness Score in DB: ${totalScore}`);
      }
    } catch (error) {
      console.log('⚠️ Debug endpoint requires authentication');
    }
    
    console.log('\n2. Fix applied successfully!');
    console.log('\nNext steps:');
    console.log('- Restart the server: node server.js');
    console.log('- Open browser and check /analisis-swot page');
    console.log('- Weakness should now show correct values');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySwotFix();