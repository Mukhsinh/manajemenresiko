# Modern UI Startup Guide

## 🚨 Port Conflict Resolution

Since port 3000 is already in use by another application, this guide provides multiple options to run your Risk Management application on a different port.

## 🚀 Quick Start Options

### Option 1: Use Port 3001 (Recommended)

**Windows (Batch File):**
```bash
# Double-click this file:
start-dev-port-3001.bat
```

**Windows (Command Line):**
```bash
set PORT=3001 && npm run dev
```

**Linux/Mac:**
```bash
PORT=3001 npm run dev
```

**Access URLs:**
- Modern Dashboard: http://localhost:3001/dashboard-modern.html
- Modern Risk Profile: http://localhost:3001/risk-profile-modern.html

### Option 2: Use Custom Port

**Windows:**
```bash
set PORT=4000 && npm run dev
```

**Linux/Mac:**
```bash
PORT=4000 npm run dev
```

Replace `4000` with any available port number.

### Option 3: Use Environment File

1. Copy your existing `.env` variables to `.env.port3001`
2. Run with port 3001:
```bash
set PORT=3001 && npm run dev
```

## 📁 Files Created

### Modern UI Files
- `public/dashboard-modern.html` - Modern dashboard interface
- `public/risk-profile-modern.html` - Modern risk profile interface
- `public/js/dashboard-modern.js` - Dashboard JavaScript module
- `public/js/risk-profile-modern.js` - Risk profile JavaScript module

### Configuration Files
- `start-dev-port-3001.bat` - Windows startup script for port 3001
- `.env.port3001` - Environment template for port 3001
- `MODERN_UI_STARTUP_GUIDE.md` - This guide

## 🔧 Technical Features

### Auto Port Detection
The modern UI automatically detects the current port and host, so it works on any port without modification:

```javascript
// Automatically uses current port
const baseUrl = `${window.location.protocol}//${window.location.host}`;
```

### API Endpoint Fallbacks
Multiple API endpoints are tried for better reliability:

**Dashboard:**
- `/api/dashboard/public` (Primary)
- `/api/dashboard` (Authenticated)
- `/api/test-data/dashboard` (Fallback)

**Risk Profile:**
- `/api/risk-profile/public` (Primary)
- `/api/risk-profile/simple` (Fallback)
- `/api/risk-profile/debug` (Testing)

## 🎨 UI Features

### Dashboard
- **Hero Section**: Gradient background with hospital branding
- **Statistics Cards**: Animated counters for key metrics
- **Interactive Charts**: Line chart for trends, doughnut chart for distribution
- **Recent Activities**: Dynamic activity feed
- **Responsive Design**: Works on all screen sizes

### Risk Profile
- **Advanced Search**: Real-time search across all fields
- **Multi-level Filtering**: Filter by risk level (All, High, Medium, Low)
- **Interactive Heat Map**: 5x5 grid showing risk score distribution
- **Risk Analysis Panel**: Detailed analysis with visual indicators
- **Pagination**: Efficient handling of large datasets

## 🔍 Testing

Run the integration test:
```bash
node test-modern-ui.js
```

This will verify:
- File creation and sizes
- HTML structure validation
- JavaScript module validation
- API endpoint compatibility
- Backend route verification

## 🛠️ Troubleshooting

### Port Issues
**Problem**: Port already in use
**Solution**: Use the provided startup scripts or set a different PORT environment variable

### Data Loading Issues
**Problem**: Data doesn't load
**Solution**: 
1. Check browser console for API errors
2. Verify server is running on the correct port
3. Ensure API endpoints are accessible

### Styling Issues
**Problem**: Styling looks broken
**Solution**: 
1. Ensure internet connection (Tailwind CSS CDN)
2. Check browser console for CSS loading errors
3. Verify Material Symbols font is loading

### Chart Issues
**Problem**: Charts don't display
**Solution**:
1. Verify Chart.js CDN is accessible
2. Check browser console for JavaScript errors
3. Ensure canvas elements are present in DOM

## 📊 Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Fetch API
- Canvas API (for charts)

## 🔐 Security Notes

### CORS Configuration
The application uses CORS middleware with configurable origins:
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
};
```

### API Endpoints
- Public endpoints (`/public`) don't require authentication
- Authenticated endpoints require valid tokens
- Debug endpoints are for development only

## 🚀 Deployment Options

### Development
```bash
# Port 3001
set PORT=3001 && npm run dev

# Custom port
set PORT=8080 && npm run dev
```

### Production
```bash
# Set production port
set PORT=80 && npm start

# Or use PM2
pm2 start server.js --name "risk-management" -- --port 3001
```

### Docker
```dockerfile
# Dockerfile example
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
ENV PORT=3001
CMD ["npm", "start"]
```

## 📈 Performance Tips

### Client-Side
- Charts are loaded lazily after DOM is ready
- Images and assets are optimized
- CSS and JS are minified via CDN

### Server-Side
- Static files are served efficiently
- API responses are cached where appropriate
- Database queries are optimized

## 🔄 Updates and Maintenance

### Regular Updates
- Update Tailwind CSS and Chart.js versions periodically
- Monitor API endpoint performance
- Test responsive design on new devices
- Validate accessibility compliance

### Monitoring
- Check server logs for errors
- Monitor API response times
- Track user interactions and performance
- Verify data accuracy and completeness

## 📞 Support

### Common Issues
1. **Port conflicts**: Use different port numbers
2. **API errors**: Check server logs and database connectivity
3. **Styling issues**: Verify CDN accessibility
4. **Performance**: Monitor network requests and optimize as needed

### Debug Mode
Enable debug logging by setting:
```bash
set DEBUG=true && set PORT=3001 && npm run dev
```

This will provide detailed console output for troubleshooting.

## 🎯 Next Steps

1. **Start the application** using one of the provided methods
2. **Test all functionality** to ensure everything works correctly
3. **Customize styling** if needed (colors, fonts, layout)
4. **Add authentication** integration if required
5. **Deploy to production** when ready

The modern UI is now ready for use with enhanced functionality, better user experience, and flexible port configuration!