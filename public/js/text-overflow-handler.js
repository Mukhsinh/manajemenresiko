/**
 * Text Overflow Handler
 * Manages text overflow with tooltips, truncation, and responsive text sizing
 */

class TextOverflowHandler {
  constructor() {
    this.textElements = new Map();
    this.tooltips = new Map();
    this.resizeObserver = null;
    this.mutationObserver = null;
    this.isInitialized = false;
    
    // Configuration
    this.config = {
      maxLength: {
        mobile: 30,
        tablet: 50,
        desktop: 80
      },
      breakpoints: {
        mobile: 640,
        tablet: 768,
        desktop: 1024
      },
      tooltipDelay: 500,
      enableTooltips: true,
      enableTruncation: true,
      enableResponsiveText: true
    };
    
    console.log('Text Overflow Handler initiali