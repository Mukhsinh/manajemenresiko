// Centralized logging utility

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },
  
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
};

module.exports = logger;

