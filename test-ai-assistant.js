// Test AI Assistant Configuration
function testAIAssistant() {
    console.log('Testing AI Assistant Configuration...');
    
    // Check environment variables
    require('dotenv').config();
    
    console.log('1. Checking environment variables:');
    console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '❌ Not set');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
    
    // Check package dependencies
    console.log('\n2. Checking package dependencies:');
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        console.log('   @google/generative-ai: ✓ Available');
        
        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            console.log('   GoogleGenerativeAI instance: ✓ Created');
        } else {
            console.log('   GoogleGenerativeAI instance: ❌ Cannot create (no API key)');
        }
    } catch (error) {
        console.log('   @google/generative-ai: ❌ Error -', error.message);
    }
    
    // Check logger utility
    console.log('\n3. Checking logger utility:');
    try {
        const logger = require('./utils/logger');
        console.log('   Logger utility: ✓ Available');
        logger.info('Test log message');
    } catch (error) {
        console.log('   Logger utility: ❌ Error -', error.message);
    }
    
    // Check auth middleware
    console.log('\n4. Checking auth middleware:');
    try {
        const { authenticateUser } = require('./middleware/auth');
        console.log('   Auth middleware: ✓ Available');
    } catch (error) {
        console.log('   Auth middleware: ❌ Error -', error.message);
    }
    
    console.log('\n5. Recommendations:');
    if (!process.env.GEMINI_API_KEY) {
        console.log('   - Add GEMINI_API_KEY to your .env file');
    }
    console.log('   - Ensure server is running on port 3000');
    console.log('   - Check browser console for frontend errors');
    console.log('   - Verify user authentication is working');
}

// Run the test
if (require.main === module) {
    testAIAssistant();
}

module.exports = testAIAssistant;