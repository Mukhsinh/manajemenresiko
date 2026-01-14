// Security headers middleware

function securityHeaders(req, res, next) {
  // RELAXED CSP for /rencana-strategis to prevent freeze issues
  const isRencanaStrategis = req.path === '/rencana-strategis' || req.path.startsWith('/js/rencana-strategis');
  
  // Common CSP sources - include unpkg.com for Lucide icons
  const scriptSrc = "'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://use.fontawesome.com https://unpkg.com";
  const styleSrc = "'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://use.fontawesome.com https://unpkg.com";
  const fontSrc = "'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://use.fontawesome.com data:";
  const connectSrc = "'self' https://*.supabase.co https://*.supabase.in https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com";
  
  if (isRencanaStrategis) {
    // More permissive CSP for rencana-strategis page
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self' 'unsafe-inline' 'unsafe-eval'; ` +
      `script-src ${scriptSrc}; ` +
      `style-src ${styleSrc}; ` +
      `font-src ${fontSrc}; ` +
      `img-src 'self' data: https: blob:; ` +
      `connect-src ${connectSrc}; ` +
      `frame-ancestors 'none';`
    );
  } else {
    // Standard CSP for other pages
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self'; ` +
      `script-src ${scriptSrc}; ` +
      `style-src ${styleSrc}; ` +
      `font-src ${fontSrc}; ` +
      `img-src 'self' data: https:; ` +
      `connect-src ${connectSrc}; ` +
      `frame-ancestors 'none';`
    );
  }

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Strict-Transport-Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  next();
}

module.exports = {
  securityHeaders
};

