# Design Document

## Overview

This design document outlines the implementation of a comprehensive URL routing refactor for the risk management application. The current system uses a single URL (`/auth/login`) for all pages with JavaScript-based navigation that only shows/hides DOM elements. The new system will implement proper SPA routing with descriptive URLs, browser history support, and deep-linking capabilities while preserving all existing functionality.

## Architecture

### Current Architecture
- **Single URL**: All pages use `/auth/login` regardless of content
- **DOM-based Navigation**: `navigateToPage()` function shows/hides page elements
- **No Browser History**: Back/forward buttons don't work properly
- **No Deep Linking**: Cannot bookmark or share specific pages

### New Architecture
- **URL-based Routing**: Each page has a unique, descriptive URL
- **History API Integration**: Proper browser history management
- **Route Guards**: Authentication middleware for protected routes
- **Fallback Handling**: 404 error pages for invalid routes

## Components and Interfaces

### 1. Router Module (`public/js/router.js`)
```javascript
class SPARouter {
    constructor(routes, options = {}) {
        this.routes = routes;
        this.currentRoute = null;
        this.authGuard = options.authGuard;
        this.fallbackRoute = options.fallbackRoute || '/404';
    }
    
    // Core routing methods
    navigate(path, replace = false);
    getCurrentRoute();
    addRoute(path, handler);
    removeRoute(path);
    
    // History management
    handlePopState(event);
    updateHistory(path, replace);
    
    // Route matching
    matchRoute(path);
    extractParams(route, path);
}
```

### 2. Route Configuration
```javascript
const routes = {
    '/': { handler: 'dashboard', auth: true },
    '/dashboard': { handler: 'dashboard', auth: true },
    '/visi-misi': { handler: 'visi-misi', auth: true },
    '/rencana-strategis': { handler: 'rencana-strategis', auth: true },
    '/analisis-swot': { handler: 'analisis-swot', auth: true },
    '/diagram-kartesius': { handler: 'diagram-kartesius', auth: true },
    '/matriks-tows': { handler: 'matriks-tows', auth: true },
    '/sasaran-strategi': { handler: 'sasaran-strategi', auth: true },
    '/strategic-map': { handler: 'strategic-map', auth: true },
    '/indikator-kinerja-utama': { handler: 'indikator-kinerja-utama', auth: true },
    '/manajemen-risiko/input-data': { handler: 'risk-input', auth: true },
    '/manajemen-risiko/risk-profile': { handler: 'risk-profile', auth: true },
    '/manajemen-risiko/residual-risk': { handler: 'residual-risk', auth: true },
    '/manajemen-risiko/monitoring-evaluasi': { handler: 'monitoring-evaluasi', auth: true },
    '/manajemen-risiko/peluang': { handler: 'peluang', auth: true },
    '/manajemen-risiko/kri': { handler: 'kri', auth: true },
    '/manajemen-risiko/loss-event': { handler: 'loss-event', auth: true },
    '/manajemen-risiko/ews': { handler: 'ews', auth: true },
    '/manajemen-risiko/risk-register': { handler: 'risk-register', auth: true },
    '/laporan': { handler: 'laporan', auth: true },
    '/master-data': { handler: 'master-data', auth: true },
    '/buku-pedoman': { handler: 'buku-pedoman', auth: true },
    '/pengaturan': { handler: 'pengaturan', auth: true },
    '/login': { handler: 'login', auth: false },
    '/404': { handler: '404', auth: false }
};
```

### 3. Authentication Guard
```javascript
class AuthGuard {
    constructor(authService) {
        this.authService = authService;
    }
    
    canActivate(route) {
        if (!route.auth) return true;
        return this.authService.isAuthenticated();
    }
    
    redirectToLogin(intendedRoute) {
        sessionStorage.setItem('intendedRoute', intendedRoute);
        return '/login';
    }
    
    getIntendedRoute() {
        return sessionStorage.getItem('intendedRoute') || '/dashboard';
    }
}
```

## Data Models

### Route Definition
```javascript
interface Route {
    path: string;           // URL path pattern
    handler: string;        // Page handler name
    auth: boolean;          // Requires authentication
    title?: string;         // Page title
    icon?: string;          // Menu icon
    parent?: string;        // Parent route for nested routes
}
```

### Navigation State
```javascript
interface NavigationState {
    currentPath: string;    // Current URL path
    previousPath: string;   // Previous URL path
    params: object;         // Route parameters
    query: object;          // Query parameters
    isAuthenticated: boolean; // User authentication status
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Unique URL per page
*For any* application page, navigating to that page should result in a unique URL that describes the page content
**Validates: Requirements 1.1**

Property 2: Deep linking functionality
*For any* valid page URL, directly accessing that URL should load the correct page content
**Validates: Requirements 1.2, 1.3**

Property 3: Page refresh preservation
*For any* application page, refreshing the browser should maintain the current page without redirecting to dashboard
**Validates: Requirements 1.4**

Property 4: Authentication route preservation
*For any* protected route accessed without authentication, after successful login the user should be redirected to the originally requested page
**Validates: Requirements 1.5, 4.2**

Property 5: URL structure consistency
*For any* generated URL, it should follow the `/module/submodule` pattern with descriptive path segments
**Validates: Requirements 2.1, 2.2**

Property 6: Legacy URL elimination
*For any* page in the application, it should not use the old `/auth/login` URL pattern
**Validates: Requirements 2.3**

Property 7: URL naming convention consistency
*For any* URL in the application, it should follow consistent naming conventions (kebab-case)
**Validates: Requirements 2.4**

Property 8: Browser history navigation
*For any* sequence of page navigations, using browser back/forward buttons should navigate correctly through the history
**Validates: Requirements 3.1, 3.2**

Property 9: SPA navigation behavior
*For any* navigation action, the browser URL should update without causing a page reload
**Validates: Requirements 3.3**

Property 10: History maintenance
*For any* route change, it should be properly recorded in browser navigation history
**Validates: Requirements 3.4**

Property 11: Authentication guard protection
*For any* protected route accessed without authentication, the user should be redirected to login with the intended destination preserved
**Validates: Requirements 4.1**

Property 12: Session persistence across navigation
*For any* authenticated user navigating between routes, the session state should remain valid
**Validates: Requirements 4.5**

Property 13: 404 error handling
*For any* invalid URL accessed, an appropriate 404 error page should be displayed with navigation options
**Validates: Requirements 5.1, 5.2**

Property 14: Invalid URL logging
*For any* invalid URL attempt, it should be logged for debugging purposes while maintaining the URL in the address bar
**Validates: Requirements 5.3, 5.4**

Property 15: Backward compatibility preservation
*For any* existing JavaScript function, calculation formula, API call, or page component, it should continue to function identically after routing implementation
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

## Error Handling

### 1. Route Not Found (404)
- Display user-friendly 404 page
- Provide navigation links to main sections
- Log invalid URL attempts
- Maintain invalid URL in address bar for debugging

### 2. Authentication Failures
- Redirect to login page
- Preserve intended destination
- Handle session expiry gracefully
- Provide clear error messages

### 3. Navigation Errors
- Fallback to dashboard on critical errors
- Log navigation failures
- Maintain application state
- Provide user feedback

## Testing Strategy

### Unit Testing
- Test individual router methods
- Test route matching logic
- Test parameter extraction
- Test authentication guard logic
- Test URL generation functions

### Property-Based Testing
The testing strategy will use **Jest** as the primary testing framework with **fast-check** for property-based testing. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

**Property-based testing requirements**:
- Each correctness property will be implemented as a single property-based test
- Tests will be tagged with comments referencing the design document property
- Tag format: `**Feature: url-routing-refactor, Property {number}: {property_text}**`
- Minimum 100 iterations per property test
- Focus on testing universal behaviors across all valid inputs

**Unit testing requirements**:
- Test specific examples and edge cases
- Test integration points between router components
- Complement property tests with concrete scenarios
- Focus on critical path validation

### Integration Testing
- Test complete navigation flows
- Test authentication integration
- Test browser history integration
- Test deep linking scenarios
- Test error handling flows

<function_calls>
<invoke name="prework">
<parameter name="featureName">url-routing-refactor