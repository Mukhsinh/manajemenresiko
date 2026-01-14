/**
 * DISABLE OLD RS SCRIPTS
 * 
 * Script ini HARUS dimuat PERTAMA sebelum script RS lainnya
 * untuk mencegah konflik dan loop
 * 
 * Created: 2026-01-11
 */

(function() {
  'use strict';
  
  console.log('[RS Disable] Disabling old RS scripts...');
  
  // Set flags to prevent old scripts from running
  window._rsUnifiedLoaded = true;
  window.RencanaStrategisCleanLoaded = true;
  window._rsCleanV7Initialized = false; // Allow v7 to run
  
  // Disable RSFinalFix
  if (window.RSFinalFix) {
    if (window.RSFinalFix.stop) window.RSFinalFix.stop();
    window.RSFinalFix = { start: () => {}, stop: () => {}, check: () => {}, isWrong: () => false };
  }
  
  // Disable RSDisplayEnforcer
  if (window.RSDisplayEnforcer) {
    if (window.RSDisplayEnforcer.stop) window.RSDisplayEnforcer.stop();
    window.RSDisplayEnforcer = { start: () => {}, stop: () => {}, check: () => {}, isWrong: () => false };
  }
  
  // Clear any existing intervals that might be from old scripts
  // This is a bit aggressive but necessary to stop the loops
  const highestId = window.setTimeout(() => {}, 0);
  for (let i = highestId - 100; i < highestId; i++) {
    window.clearInterval(i);
  }
  
  console.log('[RS Disable] Old RS scripts disabled');
})();
