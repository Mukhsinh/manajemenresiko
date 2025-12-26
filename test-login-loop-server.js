#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting test server for login loop fix...');

const PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Security check
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        // Get file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Server error');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log('');
    console.log('📋 Test URLs:');
    console.log(`   Main App: http://localhost:${PORT}/`);
    console.log(`   Login Loop Fix Test: http://localhost:${PORT}/test-login-loop-fix.html`);
    console.log('');
    console.log('🧪 Testing Steps:');
    console.log('1. Open the main app URL');
    console.log('2. Try to login (use any credentials for testing)');
    console.log('3. Check console for login loop prevention logs');
    console.log('4. Test navigation between pages');
    console.log('5. Open the test page for detailed diagnostics');
    console.log('');
    console.log('🔍 What to look for:');
    console.log('✅ No infinite redirect loops');
    console.log('✅ Navigation works after login');
    console.log('✅ Console shows "Login loop prevention initialized"');
    console.log('✅ Auth state is consistent');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});