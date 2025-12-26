#!/usr/bin/env node

// Auto Port Startup Script
const { spawn } = require('child_process');
const { findAvailablePort, getPort } = require('./config/port');

async function startServer() {
    try {
        console.log('🚀 Starting Risk Management Application...');
        console.log('🔍 Finding available port...');
        
        const port = await findAvailablePort(getPort());
        console.log(`✅ Found available port: ${port}`);
        
        // Set the PORT environment variable
        process.env.PORT = port;
        
        // Start the server
        const serverProcess = spawn('node', ['server.js'], {
            stdio: 'inherit',
            env: { ...process.env, PORT: port }
        });
        
        serverProcess.on('close', (code) => {
            console.log(`\n📊 Server process exited with code ${code}`);
        });
        
        serverProcess.on('error', (error) => {
            console.error('❌ Failed to start server:', error);
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            serverProcess.kill('SIGINT');
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Shutting down server...');
            serverProcess.kill('SIGTERM');
        });
        
    } catch (error) {
        console.error('❌ Failed to start application:', error.message);
        console.error('💡 Please check if ports 3001-3010 are available');
        process.exit(1);
    }
}

// Run the startup script
startServer();