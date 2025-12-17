const { createClient } = require('@supabase/supabase-js');
const http = require('http');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function getRealToken() {
    console.log('Getting real authentication token...');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@example.com',
            password: 'admin123'
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✓ Authentication successful');
        return data.session.access_token;
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        return null;
    }
}

async function testAIWithRealAuth() {
    const token = await getRealToken();
    
    if (!token) {
        console.log('Cannot proceed without valid token');
        return;
    }
    
    console.log('\nTesting AI Assistant with real auth token...');
    
    // Test status endpoint first
    console.log('1. Testing status endpoint...');
    const statusResult = await makeRequest('/api/ai-assistant/status', 'GET', null, token);
    console.log('Status result:', statusResult);
    
    if (statusResult.available) {
        console.log('\n2. Testing chat endpoint...');
        const chatResult = await makeRequest('/api/ai-assistant/chat', 'POST', {
            message: 'Halo, apa itu manajemen risiko?',
            conversationHistory: []
        }, token);
        console.log('Chat result:', chatResult);
    } else {
        console.log('❌ AI service not available, skipping chat test');
    }
}

function makeRequest(path, method, data, token) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        const req = http.request(options, (res) => {
            console.log(`${method} ${path} - Status: ${res.statusCode}`);
            
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve(jsonData);
                } catch (error) {
                    resolve({ 
                        rawResponse: responseData, 
                        status: res.statusCode,
                        error: 'Failed to parse JSON response'
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

// Run the test
testAIWithRealAuth().catch(console.error);