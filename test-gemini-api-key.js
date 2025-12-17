const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPIKey() {
    console.log('Testing Gemini API Key...');
    
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not found in environment');
        return;
    }
    
    console.log('✓ API Key found in environment');
    console.log('API Key (first 20 chars):', process.env.GEMINI_API_KEY.substring(0, 20) + '...');
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✓ GoogleGenerativeAI instance created');
        
        // Try different model names
        const modelsToTry = [
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest', 
            'gemini-1.0-pro-latest',
            'gemini-1.0-pro',
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'models/gemini-1.5-flash-latest',
            'models/gemini-1.5-pro-latest',
            'models/gemini-1.0-pro-latest',
            'models/gemini-pro',
            'models/gemini-1.5-pro',
            'models/gemini-1.5-flash'
        ];
        
        for (const modelName of modelsToTry) {
            console.log(`\nTrying model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                console.log(`✓ Model instance created for ${modelName}`);
                
                const result = await model.generateContent('Hello, test message');
                const response = await result.response;
                const text = response.text();
                
                console.log(`✓ ${modelName} - SUCCESS!`);
                console.log(`Response: ${text.substring(0, 100)}...`);
                
                // If we get here, this model works
                return modelName;
                
            } catch (error) {
                console.log(`❌ ${modelName} - ${error.message.split('\n')[0]}`);
            }
        }
        
        console.log('\n❌ No working models found');
        
    } catch (error) {
        console.error('❌ Error with API key:', error.message);
    }
}

testGeminiAPIKey().then(workingModel => {
    if (workingModel) {
        console.log(`\n🎉 Working model found: ${workingModel}`);
        console.log('Update your routes/ai-assistant.js to use this model');
    } else {
        console.log('\n💡 Suggestions:');
        console.log('1. Check if your API key is valid');
        console.log('2. Ensure you have enabled the Generative AI API in Google Cloud Console');
        console.log('3. Check if you have sufficient quota');
        console.log('4. Try generating a new API key');
    }
}).catch(console.error);