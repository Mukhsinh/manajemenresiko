const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listAvailableModels() {
    console.log('Listing available Gemini models...');
    
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY not found in environment');
        return;
    }
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try to list models (this method might not exist in current version)
        console.log('Trying to list models...');
        // const models = await genAI.listModels();
        
        // Skip model listing for now
        
    } catch (error) {
        console.error('Error listing models:', error.message);
        
        // Try some common model names
        console.log('\nTrying common model names...');
        const commonModels = [
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-pro',
            'gemini-pro-vision',
            'text-bison-001',
            'chat-bison-001'
        ];
        
        for (const modelName of commonModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hello');
                console.log(`✓ ${modelName} - Working`);
                break;
            } catch (err) {
                console.log(`❌ ${modelName} - ${err.message.split('\n')[0]}`);
            }
        }
    }
}

listAvailableModels().catch(console.error);