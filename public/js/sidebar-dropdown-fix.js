/**
 * Sidebar Dropdown Fix
 * Memperbaiki masalah dropdown submenu di sidebar navigasi
 * Created: 2026-01-10
 * Updated: 2026-01-10 - Enhanced fix with better event handling
 */

(function() {
    'use strict';
    
    console.log('🔧 Sidebar Dropdown Fix: Initializing...');
    
    // Flag to prevent multiple initializations
    let isInitialized = false;
    
    /**
     * Initialize sidebar dropdown functionality
     */
    function initSidebarDropdowns() {
        // Prevent multiple initializations
        if (isInitialized) {
            console.log('ℹ️ Sidebar dropdowns already initialized');
            return;
        }
        
        console.log('🔧 Setting up sidebar dropdown handlers...');
        
        // Get all dropdown toggles
        const dropdownToggles = document.querySelectorAll('.sidebar-section-label.dropdown-toggle, .dropdown-toggle[data-section]');
        
        if (dropdownToggles.length === 0) {
            console.warn('⚠️ No dropdown toggles found in sidebar, retrying in 500ms...');
            setTimeout(initSidebarDropdowns, 500);
            return;
        }
        
        console.log(`📋 Found ${dropdownToggles.length} dropdown toggles`);
        
        dropdownToggles.forEach((toggle, index) => {
            const section = toggle.dataset.section;
            console.log(`🔧 Setting up dropdown for section: ${section}`);
            
            // Remove existing event listeners by cloning
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);
            
            // Add click handler with capture phase
            newToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                console.log(`🖱️ Dropdown clicked: ${section}`);
                
                toggleSubmenu(this, section);
            }, true); // Use capture phase
            
            // Also add mousedown handler as backup
            newToggle.addEventListener('mousedown', function(e) {
                // Only handle left click
                if (e.button !== 0) return;
                
                e.preventDefault();
                e.stopPropagation();
            }, true);
            
            console.log(`✅ Dropdown handler attached for: ${section}`);
        });
        
        // Auto-expand current page's section
        autoExpandCurrentSection();
        
        isInitialized = true;
        console.log('✅ Sidebar dropdowns initialized successfully');
    }
    
    /**
     * Toggle submenu visibility
     */
    function toggleSubmenu(toggleElement, section) {
        const submenu = document.querySelector(`.sidebar-submenu[data-submenu="${section}"]`);
        const chevronIcon = toggleElement.querySelector('.dropdown-icon, .fa-chevron-down, .fa-chevron-up');
        
        if (!submenu) {
            console.error(`❌ Submenu not found for section: ${section}`);
            return;
        }
        
        // Check current state
        const isExpanded = submenu.classList.contains('expanded');
        
        console.log(`📂 Toggling submenu ${section}: ${isExpanded ? 'closing' : 'opening'}`);
        
        // Close all other submenus first
        closeAllSubmenus(section);
        
        // Toggle this submenu
        if (isExpanded) {
            // Close this submenu
            submenu.classList.remove('expanded');
            toggleElement.classList.remove('active');
            
            // Force style update
            submenu.style.display = 'none';
            submenu.style.visibility = 'hidden';
            submenu.style.opacity = '0';
            submenu.style.maxHeight = '0';
            
            if (chevronIcon) {
                chevronIcon.classList.remove('fa-chevron-up');
                chevronIcon.classList.add('fa-chevron-down');
                chevronIcon.style.transform = 'rotate(0deg)';
            }
            
            console.log(`📁 Closed submenu: ${section}`);
        } else {
            // Open this submenu
            submenu.classList.add('expanded');
            toggleElement.classList.add('active');
            
            // Force style update
            submenu.style.display = 'flex';
            submenu.style.visibility = 'visible';
            submenu.style.opacity = '1';
            submenu.style.maxHeight = '2000px';
            submenu.style.overflow = 'visible';
            
            if (chevronIcon) {
                chevronIcon.classList.remove('fa-chevron-down');
                chevronIcon.classList.add('fa-chevron-up');
                chevronIcon.style.transform = 'rotate(180deg)';
            }
            
            console.log(`📂 Opened submenu: ${section}`);
        }
    }
    
    /**
     * Close all submenus except the specified one
     */
    function closeAllSubmenus(exceptSection = null) {
        const allToggles = document.querySelectorAll('.sidebar-section-label.dropdown-toggle, .dropdown-toggle[data-section]');
        
        allToggles.forEach(toggle => {
            const section = toggle.dataset.section;
            
            if (section === exceptSection) return;
            
            const submenu = document.querySelector(`.sidebar-submenu[data-submenu="${section}"]`);
            const chevronIcon = toggle.querySelector('.dropdown-icon, .fa-chevron-down, .fa-chevron-up');
            
            if (submenu) {
                submenu.classList.remove('expanded');
                submenu.style.display = 'none';
                submenu.style.visibility = 'hidden';
                submenu.style.opacity = '0';
                submenu.style.maxHeight = '0';
            }
            
            toggle.classList.remove('active');
            
            if (chevronIcon) {
                chevronIcon.classList.remove('fa-chevron-up');
                chevronIcon.classList.add('fa-chevron-down');
                chevronIcon.style.transform = 'rotate(0deg)';
            }
        });
    }
    
    /**
     * Auto-expand the section containing the current active page
     */
    function autoExpandCurrentSection() {
        const activePage = document.querySelector('.menu-item.active:not(.menu-item-top)');
        
        if (!activePage) {
            console.log('ℹ️ No active page found for auto-expand');
            return;
        }
        
        const parentSubmenu = activePage.closest('.sidebar-submenu');
        
        if (!parentSubmenu) {
            console.log('ℹ️ Active page is not in a submenu');
            return;
        }
        
        const section = parentSubmenu.dataset.submenu;
        const toggle = document.querySelector(`.dropdown-toggle[data-section="${section}"]`);
        
        if (toggle && parentSubmenu) {
            parentSubmenu.classList.add('expanded');
            parentSubmenu.style.display = 'flex';
            parentSubmenu.style.visibility = 'visible';
            parentSubmenu.style.opacity = '1';
            parentSubmenu.style.maxHeight = '2000px';
            
            toggle.classList.add('active');
            
            const chevronIcon = toggle.querySelector('.dropdown-icon, .fa-chevron-down, .fa-chevron-up');
            if (chevronIcon) {
                chevronIcon.classList.remove('fa-chevron-down');
                chevronIcon.classList.add('fa-chevron-up');
                chevronIcon.style.transform = 'rotate(180deg)';
            }
            
            console.log(`📂 Auto-expanded section: ${section}`);
        }
    }
    
    /**
     * Re-initialize dropdowns (useful after dynamic content changes)
     */
    function reinitialize() {
        console.log('🔄 Re-initializing sidebar dropdowns...');
        isInitialized = false;
        initSidebarDropdowns();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebarDropdowns);
    } else {
        // DOM already loaded
        initSidebarDropdowns();
    }
    
    // Also initialize after delays to handle dynamic content
    setTimeout(initSidebarDropdowns, 100);
    setTimeout(initSidebarDropdowns, 500);
    setTimeout(initSidebarDropdowns, 1000);
    
    // Expose reinitialize function globally
    window.reinitializeSidebarDropdowns = reinitialize;
    
    console.log('✅ Sidebar Dropdown Fix: Module loaded');
})();
