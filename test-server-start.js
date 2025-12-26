// Test server startup
require('dotenv').config();

const PORT = process.env.PORT || 3001;
console.log('Testing server startup...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

try {
  const app = require('./server.js');
  console.log('✅ Server module loaded successfully');
  console.log('✅ Server should be running on port', PORT);
  console.log('✅ Access at: http://localhost:' + PORT);
} catch (error) {
  console.error('❌ Error loading server:', error.message);
  console.error(error.stack);
  process.exit(1);
}

