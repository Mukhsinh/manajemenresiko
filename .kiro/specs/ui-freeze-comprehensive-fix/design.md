# Design Document: UI Freeze Comprehensive Fix

## Overview

Dokumen ini menjelaskan desain solusi untuk memperbaiki masalah UI freeze dan display issues pada aplikasi Manajemen Risiko Rumah Sakit. Solusi ini fokus pada:

1. Menghapus CSS dan JS yang menyebabkan konflik
2. Membuat sistem page isolation yang lebih sederhana dan efektif
3. Memperbaiki race condition pada module loading
4. Memastikan kop header tampil di semua halaman
5. Mengoptimalkan performa loading

## Architecture

### Current Problem Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT PROBLEMATIC STATE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ rencana-strategis│    │ rs-page-isolation│                   │
│  │ -freeze-fix.css  │    │ .css             │                   │
│  │                  │    │                  │                   │
│  │ position:relative│    │ z-index conflicts│                   │
│  │ !important on *  │    │ display:none     │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌───────────────────────┐                              │
│           │   CSS CONFLICTS       │                              │
│           │   - Layering broken   │                              │
│           │   - Elements hidden   │                              │
│           │   - Clicks blocked    │                              │
│           └───────────────────────┘                              │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ rencana-strategis│    │ rs-page-isolation│                   │
│  │ -freeze-fix.js   │    │ .js              │                   │
│  │                  │    │                  │                   │
│  │ EventListener    │    │ MutationObserver │                   │
│  │ override         │    │ aggressive       │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌───────────────────────┐                              │
│           │   JS CONFLICTS        │                              │
│           │   - Race conditions   │                              │
│           │   - Infinite loops    │                              │
│           │   - Event blocking    │                              │
│           └───────────────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPOSED CLEAN ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SINGLE CSS FILE                          │   │
│  │                  page-manager.css                         │   │
│  │                                                           │   │
│  │  - Simple page visibility rules                          │   │
│  │  - No !important overuse                                 │   │
│  │  - Clean z-index hierarchy                               │   │
│  │  - Proper layering without conflicts                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SINGLE JS FILE                           │   │
│  │                  page-manager.js                          │   │
│  │                                                           │   │
│  │  - Centralized page navigation                           │   │
│  │  - Proper cleanup on page change                         │   │
│  │  - No MutationObserver abuse                             │   │
│  │  - No EventListener override                             │   │
│  │  - Debounced operations                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  MODULE LOADER                            │   │
│  │                  module-loader-v2.js                      │   │
│  │                                                           │   │
│  │  - Sequential module loading                             │   │
│  │  - Dependency resolution                                 │   │
│  │  - Error handling                                        │   │
│  │  - Load state tracking                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PageManager (page-manager.js)

```javascript
interface PageManager {
  // Initialize the page manager
  init(): void;
  
  // Navigate to a specific page
  navigateTo(pageName: string): Promise<void>;
  
  // Get current active page
  getCurrentPage(): string;
  
  // Register page load callback
  onPageLoad(pageName: string, callback: Function): void;
  
  // Register page unload callback
  onPageUnload(pageName: string, callback: Function): void;
  
  // Cleanup resources for a page
  cleanup(pageName: string): void;
}
```

### 2. ModuleLoader (module-loader-v2.js)

```javascript
interface ModuleLoader {
  // Load a module by name
  load(moduleName: string): Promise<Module>;
  
  // Check if module is loaded
  isLoaded(moduleName: string): boolean;
  
  // Get module instance
  get(moduleName: string): Module | null;
  
  // Unload a module
  unload(moduleName: string): void;
  
  // Register module dependencies
  registerDependencies(moduleName: string, deps: string[]): void;
}
```

### 3. KopHeaderManager (kop-header-manager.js)

```javascript
interface KopHeaderManager {
  // Initialize kop header
  init(): Promise<void>;
  
  // Load kop settings from API or cache
  loadSettings(): Promise<KopSettings>;
  
  // Render kop header
  render(): void;
  
  // Show/hide kop header
  setVisible(visible: boolean): void;
  
  // Clear cache
  clearCache(): void;
}
```

## Data Models

### PageState

```typescript
interface PageState {
  currentPage: string;
  previousPage: string | null;
  isLoading: boolean;
  loadStartTime: number;
  modules: Map<string, ModuleState>;
}

interface ModuleState {
  name: string;
  isLoaded: boolean;
  isInitialized: boolean;
  loadTime: number;
  error: Error | null;
}
```

### KopSettings

```typescript
interface KopSettings {
  organizationName: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  cachedAt: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Page Load Completeness
*For any* navigation to `/rencana-strategis`, the page SHALL display all required UI elements (statistics cards, form, data table) within 2 seconds without requiring a refresh.
**Validates: Requirements 1.1, 1.2**

### Property 2: Interactive Elements Availability
*For any* page after loading completes, all interactive elements (buttons, inputs, links) SHALL have `pointer-events: auto` and NOT be disabled unless explicitly intended.
**Validates: Requirements 1.4, 2.2**

### Property 3: Cross-Page Interactivity Preservation
*For any* navigation sequence that includes `/rencana-strategis`, navigating to any other page SHALL result in that page being fully interactive with all buttons responding to clicks.
**Validates: Requirements 2.1, 2.4**

### Property 4: Page Isolation Correctness
*For any* active page, all other page-content elements SHALL have `display: none` or `visibility: hidden`, and the active page SHALL have `display: block` and `visibility: visible`.
**Validates: Requirements 3.3, 3.4**

### Property 5: Z-Index Hierarchy Consistency
*For any* page state, the z-index values SHALL follow a consistent hierarchy where modals > dropdowns > active page > inactive pages, with no conflicts.
**Validates: Requirements 3.1, 3.2**

### Property 6: Kop Header Visibility
*For any* authenticated user on any page, the kop header element SHALL be visible and positioned within the top header area.
**Validates: Requirements 4.1, 4.2**

### Property 7: Event Listener Deduplication
*For any* element, there SHALL be no duplicate event listeners for the same event type and handler function.
**Validates: Requirements 5.3**

### Property 8: MutationObserver Throttling
*For any* MutationObserver callback, the execution frequency SHALL be limited to prevent more than 10 callbacks per second on the same target.
**Validates: Requirements 5.2**

### Property 9: Resource Cleanup on Navigation
*For any* page navigation, the previous page's module cleanup function SHALL be called before the new page's module is loaded.
**Validates: Requirements 5.4**

### Property 10: Initial Render Performance
*For any* page request, visible content SHALL begin rendering within 500ms of navigation start.
**Validates: Requirements 6.1**

## Error Handling

### Page Load Errors

1. **Module Load Failure**: If a page module fails to load, display an error message with retry option
2. **API Timeout**: If API calls timeout, use cached data if available, otherwise show error
3. **CSS Load Failure**: Ensure base styles are inline to prevent complete UI breakdown

### Navigation Errors

1. **Invalid Page**: Redirect to dashboard with error notification
2. **Auth Required**: Redirect to login if session expired
3. **Concurrent Navigation**: Queue navigation requests to prevent race conditions

### Recovery Strategies

1. **Automatic Retry**: Retry failed operations up to 3 times with exponential backoff
2. **Graceful Degradation**: Show partial UI if some components fail
3. **Manual Refresh**: Provide clear "Refresh" button for user-initiated recovery

## Testing Strategy

### Dual Testing Approach

This solution uses both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property-based tests**: Verify universal properties that should hold across all inputs

### Property-Based Testing Framework

We will use **fast-check** library for JavaScript property-based testing.

Configuration:
- Minimum 100 iterations per property test
- Seed-based reproducibility for debugging

### Test Categories

1. **Page Navigation Tests**
   - Test navigation to all pages
   - Test navigation sequences
   - Test concurrent navigation attempts

2. **UI Interactivity Tests**
   - Test button click responses
   - Test form input handling
   - Test scroll behavior

3. **CSS Isolation Tests**
   - Test page visibility states
   - Test z-index hierarchy
   - Test element positioning

4. **Performance Tests**
   - Test page load times
   - Test render performance
   - Test memory usage

### Test Annotations

Each property-based test MUST be tagged with:
```javascript
// **Feature: ui-freeze-comprehensive-fix, Property {number}: {property_text}**
```

