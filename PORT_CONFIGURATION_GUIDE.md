# Port Configuration Guide

## 🚀 Quick Start

Since port 3000 is already in use, the application has been configured to automatically find and use an available port starting from 3001.

### Option 1: Automatic Port Detection (Recommended)
```bash
npm run dev:auto
```

### Option 2: Windows Batch File
```bash
start-dev-auto-port.bat
```

### Option 3: Manual Port Selection
```bash
PORT=3005 npm run dev
```

### Option 4: Direct Script
```bash
node start-auto-port.js
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev:auto` | Start with automatic port detection |
| `npm run dev:port` | Same as dev:auto (alias) |
| `npm run dev` | Standard nodemon (may fail if port in use) |
| `npm start` | Production start (may fail if port in use) |

## 🔧 Port Configuration Features

### Automatic Port Detection
- **Default starting port**: 3001 (changed from 3000)
- **Port range**: 3001-3010 (automatically searches for available port)
- **Fallback**: If no port found in range, shows error with suggestions

### Environment Variable Support
```bash
# Set specific port
PORT=3005 npm run dev:auto

# Set port for current session (Windows)
set PORT=3005 && npm run dev:auto

# Set port for current session (Linux/Mac)
export PORT=3005 && npm run dev:auto
```

### Port Availability Checking
- Automatically checks if port is available before starting
- Shows clear error messages if ports are in use
- Provides alternative port suggestions

## 🌐 Accessing Modern UI

Once the server starts, you'll see output like:
```
========================================
Server running on port 3003
Access: http://localhost:3003
Modern Dashboard: http://localhost:3003/dashboard-modern.html
Modern Risk Profile: http://localhost:3003/risk-profile-modern.html
Environment: development
========================================
```

### Modern UI URLs
- **Dashboard**: `http://localhost:[PORT]/dashboard-modern.html`
- **Risk Profile**: `http://localhost:[PORT]/risk-profile-modern.html`
- **Original App**: `http://localhost:[PORT]/index.html`

## 🛠️ Troubleshooting

### Port Already in Use
If you see "Port already in use" error:

1. **Use automatic port detection**:
   ```bash
   npm run dev:auto
   ```

2. **Check what's using the port**:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

3. **Kill process using the port** (if safe to do so):
   ```bash
   # Windows (replace PID with actual process ID)
   taskkill /PID [PID] /F
   
   # Linux/Mac
   kill -9 [PID]
   ```

4. **Use a different port manually**:
   ```bash
   PORT=3005 npm run dev
   ```

### No Available Ports
If all ports 3001-3010 are in use:

1. **Set a higher port number**:
   ```bash
   PORT=8000 npm run dev:auto
   ```

2. **Check system for port conflicts**:
   ```bash
   # Windows
   netstat -ano | findstr :300
   
   # Linux/Mac
   netstat -tulpn | grep :300
   ```

### Server Won't Start
1. **Check Node.js version** (requires Node.js 14+):
   ```bash
   node --version
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Check for syntax errors**:
   ```bash
   node test-port-config.js
   ```

## 📁 Configuration Files

### `config/port.js`
- Contains port configuration logic
- Handles port availability checking
- Provides fallback mechanisms

### `start-auto-port.js`
- Cross-platform startup script
- Automatically finds available port
- Handles graceful shutdown

### `start-dev-auto-port.bat`
- Windows batch file for easy startup
- Sets default port to 3001

## 🔄 Development Workflow

### For Development
```bash
# Start with auto port detection
npm run dev:auto

# The server will show:
# - Which port it's using
# - Direct URLs to modern UI pages
# - Environment information
```

### For Production
```bash
# Set production port
PORT=80 npm start

# Or use PM2 for production
pm2 start server.js --name "risk-management" -- --port 80
```

## 📊 Testing Port Configuration

Run the port configuration test:
```bash
node test-port-config.js
```

This will:
- Check default port settings
- Test port availability
- Find available ports
- Test environment variable handling

## 🎯 Best Practices

1. **Always use automatic port detection** during development
2. **Set specific ports** for production environments
3. **Document the port** your application is using
4. **Use environment variables** for different environments
5. **Check port availability** before deployment

## 🚀 Quick Reference

| Scenario | Command |
|----------|---------|
| First time setup | `npm run dev:auto` |
| Port 3000 in use | `npm run dev:auto` |
| Need specific port | `PORT=3005 npm run dev:auto` |
| Windows user | `start-dev-auto-port.bat` |
| Production | `PORT=80 npm start` |
| Testing | `node test-port-config.js` |

## 📝 Notes

- The application will automatically find the first available port starting from 3001
- All existing functionality remains unchanged
- Modern UI pages work on any port the server uses
- The server provides direct URLs to modern UI pages in the startup message
- Port configuration is backward compatible with existing deployment scripts