# Implementation Plan

## Overview

Implementasi perbaikan UI freeze dan display issues pada aplikasi Manajemen Risiko Rumah Sakit.

---

- [x] 1. Disable Problematic CSS and JS Files




  - [x] 1.1 Rename `public/css/rencana-strategis-freeze-fix.css` to `.disabled` extension


    - This file contains `position: relative !important` on all elements causing layering issues


    - _Requirements: 3.1, 3.2_

  - [-] 1.2 Rename `public/js/rencana-strategis-freeze-fix.js` to `.disabled` extension



    - This file overrides EventListener and MutationObserver causing freeze




    - _Requirements: 5.2, 5.3_
  - [ ] 1.3 Rename `public/js/rs-page-isolation.js` to `.disabled` extension
    - This file has aggressive MutationObserver that conflicts with other pages
    - _Requirements: 3.4, 5.2_
  - [ ] 1.4 Rename `public/js/rs-strict-isolation.js` to `.disabled` extension
    - Additional isolation script causing conflicts




    - _Requirements: 3.4_
  - [ ] 1.5 Update `public/index.html` to remove references to disabled files
    - Remove script and link tags for disabled files
    - _Requirements: 3.1, 3.4_

- [ ] 2. Create Unified Page Manager CSS
  - [ ] 2.1 Create `public/css/page-manager.css` with clean page visibility rules
    - Simple `.page-content` visibility rules
    - Clean z-index hierarchy (modals: 1050, dropdowns: 1040, pages: 1)
    - No excessive `!important` usage


    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 2.2 Write property test for z-index hierarchy
    - **Property 5: Z-Index Hierarchy Consistency**
    - **Validates: Requirements 3.1, 3.2**

- [ ] 3. Create Unified Page Manager JS
  - [ ] 3.1 Create `public/js/page-manager.js` with centralized navigation
    - Implement `PageManager` interface from design
    - Handle page show/hide with proper cleanup
    - No MutationObserver abuse
    - Debounced navigation to prevent race conditions
    - _Requirements: 2.1, 3.3, 3.4, 5.4_
  - [ ]* 3.2 Write property test for page isolation
    - **Property 4: Page Isolation Correctness**
    - **Validates: Requirements 3.3, 3.4**
  - [ ]* 3.3 Write property test for cross-page interactivity
    - **Property 3: Cross-Page Interactivity Preservation**
    - **Validates: Requirements 2.1, 2.4**

- [ ] 4. Fix Rencana Strategis Module
  - [ ] 4.1 Update `public/js/rencana-strategis.js` to remove aggressive protections
    - Remove MutationObserver that causes infinite loops
    - Remove EventListener overrides
    - Keep core functionality (load, render, CRUD operations)
    - Add proper cleanup function for page unload
    - _Requirements: 1.1, 1.2, 1.4, 5.2, 5.3_
  - [ ]* 4.2 Write property test for page load completeness
    - **Property 1: Page Load Completeness**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 4.3 Write property test for interactive elements
    - **Property 2: Interactive Elements Availability**
    - **Validates: Requirements 1.4, 2.2**

- [ ] 5. Fix Kop Header Display
  - [ ] 5.1 Create `public/js/kop-header-manager.js` for centralized kop management
    - Implement `KopHeaderManager` interface from design
    - Load kop settings from API with caching
    - Render kop header in top header area
    - Ensure visibility on all pages
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 5.2 Update `public/js/app.js` to initialize kop header manager
    - Call `KopHeaderManager.init()` after authentication
    - Ensure kop header is rendered on page load
    - _Requirements: 4.1, 4.2_
  - [ ]* 5.3 Write property test for kop header visibility
    - **Property 6: Kop Header Visibility**
    - **Validates: Requirements 4.1, 4.2**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Update Index.html with New Files
  - [ ] 7.1 Add link to `page-manager.css` in `public/index.html`
    - Add after other CSS files but before closing head tag
    - _Requirements: 3.1_
  - [ ] 7.2 Add script tag for `page-manager.js` in `public/index.html`
    - Add early in body, before other page scripts
    - _Requirements: 3.3, 3.4_
  - [ ] 7.3 Add script tag for `kop-header-manager.js` in `public/index.html`
    - Add after app.js
    - _Requirements: 4.1_

- [ ] 8. Fix Event Listener Deduplication
  - [ ] 8.1 Update `public/js/app.js` to prevent duplicate event listeners
    - Add `data-handler-attached` attribute check before attaching listeners
    - Remove any existing duplicate listener attachments
    - _Requirements: 5.3_
  - [ ]* 8.2 Write property test for event listener deduplication
    - **Property 7: Event Listener Deduplication**
    - **Validates: Requirements 5.3**

- [ ] 9. Optimize Page Load Performance
  - [ ] 9.1 Add `defer` attribute to non-critical scripts in `public/index.html`
    - Identify scripts that can be deferred
    - Add defer attribute to those scripts
    - _Requirements: 6.1, 6.2_
  - [ ] 9.2 Ensure critical CSS is loaded first
    - Move critical CSS (style.css, page-manager.css) to top of head
    - _Requirements: 6.1_
  - [ ]* 9.3 Write property test for initial render performance
    - **Property 10: Initial Render Performance**
    - **Validates: Requirements 6.1**

- [ ] 10. Cleanup Redundant Files
  - [ ] 10.1 Identify and disable other conflicting CSS files
    - Review `rs-complete-isolation.css`, `rs-strict-isolation.css`
    - Rename to `.disabled` if causing conflicts
    - _Requirements: 3.1, 3.2_
  - [ ] 10.2 Identify and disable other conflicting JS files
    - Review `prevent-rs-*.js`, `remove-rs-*.js` files
    - Rename to `.disabled` if causing conflicts
    - _Requirements: 3.4, 5.2_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration Testing
  - [ ] 12.1 Test navigation to all pages after fix
    - Verify each page displays correctly
    - Verify all buttons are clickable
    - Verify no freeze occurs
    - _Requirements: 1.1, 2.1, 2.2, 3.1_
  - [ ] 12.2 Test rencana-strategis page specifically
    - Verify page loads without refresh
    - Verify statistics cards, form, and table display
    - Verify all buttons work
    - _Requirements: 1.1, 1.2, 1.4_
  - [ ] 12.3 Test kop header on all pages
    - Verify kop header is visible on dashboard
    - Verify kop header persists during navigation
    - _Requirements: 4.1, 4.2_

