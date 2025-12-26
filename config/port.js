// Port Configuration
const DEFAULT_PORT = 3001; // Changed from 3000 to avoid conflicts

// Get port from environment or use default
const getPort = () => {
    const envPort = process.env.PORT;
    
    if (envPort) {
        const port = parseInt(envPort, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.warn(`Invalid PORT environment variable: ${envPort}. Using default port ${DEFAULT_PORT}`);
            return DEFAULT_PORT;
        }
        return port;
    }
    
    return DEFAULT_PORT;
};

// Check if port is available
const checkPortAvailable = (port) => {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(true);
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(false);
        });
    });
};

// Find available port starting from preferred port
const findAvailablePort = async (startPort = DEFAULT_PORT) => {
    let port = startPort;
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
        const isAvailable = await checkPortAvailable(port);
        if (isAvailable) {
            return port;
        }
        port++;
    }
    
    throw new Error(`No available port found after checking ${maxAttempts} ports starting from ${startPort}`);
};

module.exports = {
    DEFAULT_PORT,
    getPort,
    checkPortAvailable,
    findAvailablePort
};