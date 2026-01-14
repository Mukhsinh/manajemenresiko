/**
 * Rencana Strategis Fix v2.2
 * Fixes: 1. Stat Cards display, 2. Badge in Status column, 3. Kode column empty
 * Date: 2026-01-14
 * 
 * CRITICAL: This script applies aggressive inline style fixes to ensure
 * the display is correct regardless of CSS conflicts
 */

(function() {
  'use strict';
  
  const VERSION = '2.3';
  console.log(`🔧 Rencana Strategis Fix v${VERSION} loaded`);
  
  // Track if fixes have been applied
  let fixesApplied = false;
  
  // Check if on RS page
  function isOnRSPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    return path === '/rencana-strategis' || 
           path.includes('/rencana-strategis') ||
           hash === '#rencana-strategis' ||
           hash.includes('rencana-strategis') ||
           document.getElementById('rencana-strategis-content') !== null;
  }
  
  // Main initialization
  function init() {
    if (!isOnRSPage()) {
      return;
    }
    
    console.log(`🔧 [RS Fix v${VERSION}] Initializing on RS page...`);
    
    // Apply fixes with multiple delays to catch dynamic content
    applyFixes();
    setTimeout(applyFixes, 300);
    setTimeout(applyFixes, 600);
    setTimeout(applyFixes, 1000);
    setTimeout(applyFixes, 2000);
    setTimeout(applyFixes, 3000);
    
    // Set up observer for dynamic content
    observeContentChanges();
  }
  
  // Apply all fixes
  function applyFixes() {
    const container = document.getElementById('rencana-strategis-content');
    if (!container) {
      console.log(`🔧 [RS Fix v${VERSION}] Container not found, waiting...`);
      return;
    }
    
    // Check if table exists (content loaded)
    const table = container.querySelector('table');
    if (!table) {
      console.log(`🔧 [RS Fix v${VERSION}] Table not found yet, waiting...`);
      return;
    }
    
    console.log(`🔧 [RS Fix v${VERSION}] Applying fixes...`);
    
    fixStatCards(container);
    fixKodeColumn(container);
    fixStatusBadges(container);
    fixActionButtons(container);
    
    fixesApplied = true;
    console.log(`✅ [RS Fix v${VERSION}] All fixes applied`);
  }
  
  // Fix 1: Stat Cards - Ensure text is visible with white color
  function fixStatCards(container) {
    const wrapper = container.querySelector('.rs-v7-wrapper') || container;
    
    // Target semua div yang merupakan stat cards (dengan background gradient)
    const statCardRows = wrapper.querySelectorAll('.row.g-3.mb-4');
    
    statCardRows.forEach(row => {
      const cards = row.querySelectorAll('[style*="background"]');
      
      cards.forEach((card, index) => {
        // Fix semua div dengan teks di dalam kartu
        const textDivs = card.querySelectorAll('div');
        textDivs.forEach(div => {
          const text = div.textContent.trim();
          const style = div.getAttribute('style') || '';
          
          // Jika ini adalah angka (count)
          if (/^\d+$/.test(text) && !style.includes('rgba')) {
            div.style.cssText = 'color: white !important; font-size: 2.25rem !important; font-weight: 700 !important; line-height: 1 !important; text-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;';
          }
          // Jika ini adalah label
          else if (text.length > 0 && text.length < 20 && !style.includes('rgba') && !text.includes('fa-')) {
            if (!div.querySelector('i') && !div.querySelector('div')) {
              div.style.cssText = 'color: white !important; font-size: 0.875rem !important; font-weight: 600 !important; margin-top: 4px !important;';
            }
          }
        });
        
        // Fix icons
        const icons = card.querySelectorAll('i');
        icons.forEach(icon => {
          icon.style.cssText = 'color: white !important; font-size: 1.75rem !important;';
        });
      });
    });
    
    console.log(`✅ [RS Fix v${VERSION}] Fixed stat cards`);
  }
  
  // Fix 2: Kode Column - Ensure kode values are displayed
  function fixKodeColumn(container) {
    const table = container.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    const year = new Date().getFullYear();
    let fixedCount = 0;
    
    rows.forEach((row, index) => {
      const kodeCell = row.querySelector('td:first-child');
      if (!kodeCell) return;
      
      let kodeSpan = kodeCell.querySelector('span');
      let kodeText = kodeSpan ? kodeSpan.textContent.trim() : kodeCell.textContent.trim();
      
      // Generate kode if empty
      if (!kodeText || kodeText === '' || kodeText === '-') {
        kodeText = `RS-${year}-${String(index + 1).padStart(3, '0')}`;
        fixedCount++;
      }
      
      // Create or update span with proper styling
      if (!kodeSpan) {
        kodeSpan = document.createElement('span');
        kodeCell.innerHTML = '';
        kodeCell.appendChild(kodeSpan);
      }
      
      kodeSpan.textContent = kodeText;
      kodeSpan.style.cssText = `
        display: inline-block !important;
        background: #f1f5f9 !important;
        color: #1e293b !important;
        font-weight: 600 !important;
        font-size: 0.75rem !important;
        padding: 6px 10px !important;
        border-radius: 6px !important;
        border: 1px solid #e2e8f0 !important;
        font-family: 'Monaco', 'Consolas', 'Courier New', monospace !important;
        white-space: nowrap !important;
        letter-spacing: 0.5px !important;
        visibility: visible !important;
        opacity: 1 !important;
      `;
    });
    
    console.log(`✅ [RS Fix v${VERSION}] Fixed kode column (${fixedCount} generated)`);
  }
  
  // Fix 3: Status Badges - Ensure badges are in correct column with proper colors
  function fixStatusBadges(container) {
    const table = container.querySelector('table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach((row) => {
      const statusCell = row.querySelector('td:nth-child(5)');
      if (!statusCell) return;
      
      // Ensure cell is centered
      statusCell.style.cssText = `
        text-align: center !important;
        vertical-align: middle !important;
        width: 120px !important;
        min-width: 110px !important;
        padding: 12px 10px !important;
      `;
      
      const badge = statusCell.querySelector('span');
      if (!badge) return;
      
      // Get status text (remove any icons/emojis)
      let statusText = badge.textContent.replace(/[✅📝🏁]/g, '').trim();
      
      // Determine color and icon based on status
      let bgColor = '#6b7280';
      let iconClass = '';
      
      if (statusText.toLowerCase().includes('aktif')) {
        bgColor = '#22c55e';
        iconClass = 'fa-check-circle';
        statusText = 'Aktif';
      } else if (statusText.toLowerCase().includes('draft')) {
        bgColor = '#f59e0b';
        iconClass = 'fa-edit';
        statusText = 'Draft';
      } else if (statusText.toLowerCase().includes('selesai')) {
        bgColor = '#3b82f6';
        iconClass = 'fa-flag-checkered';
        statusText = 'Selesai';
      }
      
      // Apply badge styling
      badge.style.cssText = `
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background-color: ${bgColor} !important;
        color: #ffffff !important;
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        padding: 6px 10px !important;
        border-radius: 6px !important;
        white-space: nowrap !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
        visibility: visible !important;
        opacity: 1 !important;
      `;
      
      // Update badge content with icon
      if (iconClass) {
        badge.innerHTML = `<i class="fas ${iconClass}" style="margin-right: 5px; font-size: 0.65rem; color: #ffffff !important;"></i>${statusText}`;
      } else {
        badge.textContent = statusText;
      }
    });
    
    console.log(`✅ [RS Fix v${VERSION}] Fixed status badges`);
  }
  
  // Fix 4: Action Buttons - Ensure proper colors
  function fixActionButtons(container) {
    const viewBtns = container.querySelectorAll('.rs-view-btn');
    const editBtns = container.querySelectorAll('.rs-edit-btn');
    const deleteBtns = container.querySelectorAll('.rs-delete-btn');
    
    const btnBaseStyle = `
      width: 32px !important;
      height: 32px !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 6px !important;
      border: none !important;
      cursor: pointer !important;
      color: #ffffff !important;
    `;
    
    viewBtns.forEach(btn => {
      btn.style.cssText = btnBaseStyle + 'background: #0ea5e9 !important;';
      const icon = btn.querySelector('i');
      if (icon) icon.style.color = '#ffffff';
    });
    
    editBtns.forEach(btn => {
      btn.style.cssText = btnBaseStyle + 'background: #f59e0b !important;';
      const icon = btn.querySelector('i');
      if (icon) icon.style.color = '#ffffff';
    });
    
    deleteBtns.forEach(btn => {
      btn.style.cssText = btnBaseStyle + 'background: #ef4444 !important;';
      const icon = btn.querySelector('i');
      if (icon) icon.style.color = '#ffffff';
    });
    
    console.log(`✅ [RS Fix v${VERSION}] Fixed action buttons`);
  }
  
  // Observe for dynamic content changes
  function observeContentChanges() {
    const container = document.getElementById('rencana-strategis-content');
    if (!container) return;
    
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if significant content was added
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              shouldFix = true;
            }
          });
        }
      });
      
      if (shouldFix) {
        // Debounce the fix application
        clearTimeout(window._rsFixTimeout);
        window._rsFixTimeout = setTimeout(() => {
          console.log(`🔧 [RS Fix v${VERSION}] Content changed, reapplying fixes...`);
          applyFixes();
        }, 200);
      }
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true
    });
    
    console.log(`✅ [RS Fix v${VERSION}] Content observer set up`);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run on page navigation (for SPA)
  window.addEventListener('hashchange', function() {
    fixesApplied = false;
    setTimeout(init, 100);
  });
  
  // Listen for custom page change events
  document.addEventListener('pageChanged', function(e) {
    if (e.detail && (e.detail.page === 'rencana-strategis' || e.detail.path === '/rencana-strategis')) {
      fixesApplied = false;
      setTimeout(init, 100);
    }
  });
  
  document.addEventListener('page-changed', function(e) {
    fixesApplied = false;
    setTimeout(init, 100);
  });
  
  // Expose for manual triggering
  window.applyRencanaStrategisFixes = applyFixes;
  window.RSFixVersion = VERSION;
  
})();
