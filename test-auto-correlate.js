const fetch = require('node-fetch');

async function testAutoCorrelate() {
  try {
    console.log('Testing auto-correlate endpoint...');
    
    const response = await fetch('http://localhost:3000/api/sasaran-strategi/auto-correlate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mock authentication - in real app this would be a valid JWT token
        'Authorization': 'Bearer mock-token'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Auto-correlate result:', JSON.stringify(result, null, 2));
    
    if (result.correlations && result.correlations.length > 0) {
      console.log(`\nSuccessfully correlated ${result.correlations.length} sasaran strategi:`);
      result.correlations.forEach((corr, index) => {
        console.log(`\n${index + 1}. ${corr.perspektif} - ${corr.sasaran_text.substring(0, 50)}...`);
        console.log(`   -> ${corr.tows_type}: ${corr.tows_strategy.substring(0, 80)}...`);
        console.log(`   Confidence: ${corr.confidence}%`);
      });
    }
  } catch (error) {
    console.error('Error testing auto-correlate:', error.message);
  }
}

testAutoCorrelate();