# Design Document

## Overview

This design document outlines the comprehensive fix for the login system in the risk management application. The current system has multiple issues including token management, session persistence, API authentication, and user feedback. This design addresses all these issues with a robust authentication flow.

## Architecture

The authentication system follows a client-server architecture with the following components:

1. **Frontend Authentication Service** (`authService.js`): Handles client-side authentication logic
2. **Backend Authentication Routes** (`routes/auth.js`): Handles server-side authentication endpoints
3. **Authentication Middleware** (`middleware/auth.js`): Validates tokens on API requests
4. **Session Management**: Handles token storage and retrieval
5. **Error Handling**: Provides user-friendly error messages

## Components and Interfaces

### Frontend Components

#### AuthService
- **Purpose**: Centralized authentication logic
- **Methods**:
  - `login(email, password)`: Authenticate user and store session
  - `logout()`: Clear session and redirect to login
  - `checkAuth()`: Verify current authentication state
  - `getAuthToken()`: Retrieve stored authentication token
  - `onAuthStateChange(callback)`: Listen for authentication state changes

#### LoginForm
- **Purpose**: User interface for authentication
- **Features**:
  - Email/password input validation
  - Loading states and user feedback
  - Error message display
  - Form submission handling

#### SessionManager
- **Purpose**: Handle token storage and retrieval
- **Features**:
  - Secure token storage in browser
  - Token expiration handling
  - Automatic token refresh
  - Session persistence across page loads

### Backend Components

#### Authentication Routes
- **POST /api/auth/login**: Authenticate user credentials
- **POST /api/auth/logout**: Clear user session
- **GET /api/auth/me**: Get current user profile
- **POST /api/auth/register**: Register new user (if needed)

#### Authentication Middleware
- **Purpose**: Validate tokens on protected routes
- **Features**:
  - Token extraction from Authorization header
  - Token validation with Supabase
  - User profile loading
  - Organization access control

## Data Models

### User Session
```typescript
interface UserSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}
```

### User Profile
```typescript
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  organization_name: string;
}
```

### Authentication State
```typescript
interface AuthState {
  authenticated: boolean;
  user: User | null;
  session: UserSession | null;
  loading: boolean;
  error: string | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Successful authentication creates valid session
*For any* valid email and password combination, when authentication is performed, the system should create a valid session with access token and user data
**Validates: Requirements 1.1**

Property 2: Authentication token storage
*For any* successful authentication, the authentication token should be securely stored in browser storage and retrievable
**Validates: Requirements 1.2**

Property 3: Successful authentication navigation
*For any* successful authentication, the system should navigate to the dashboard page
**Validates: Requirements 1.3**

Property 4: Authentication error handling
*For any* authentication failure, the system should display appropriate error messages based on the failure type
**Validates: Requirements 1.4**

Property 5: Auto-authentication with valid session
*For any* valid existing session, the system should automatically show the application interface without requiring login
**Validates: Requirements 1.5**

Property 6: Session persistence across page refresh
*For any* authenticated user, refreshing the page should maintain the session and show the application interface
**Validates: Requirements 2.1**

Property 7: Auto-authentication on page load
*For any* valid authentication token, the system should automatically authenticate the user on page load
**Validates: Requirements 2.2**

Property 8: Expired token handling
*For any* expired authentication token, the system should redirect the user to the login page
**Validates: Requirements 2.3**

Property 9: API authentication headers
*For any* API call made while authenticated, the request should include the authentication token in the Authorization header
**Validates: Requirements 3.1**

Property 10: API authentication error responses
*For any* API call with missing or invalid authentication token, the API should return appropriate error responses
**Validates: Requirements 3.2**

Property 11: Frontend authentication error handling
*For any* API authentication failure, the frontend should handle the error gracefully and redirect to login if necessary
**Validates: Requirements 3.3**

Property 12: User profile display
*For any* loaded user profile, the system should display the user's name and role correctly in the UI
**Validates: Requirements 3.4**

Property 13: Login form loading state
*For any* login form submission, the system should show loading indicator and disable the form during processing
**Validates: Requirements 4.1**

Property 14: Login error message specificity
*For any* login failure, the system should show specific error messages based on the failure reason
**Validates: Requirements 4.4**

Property 15: Network error handling
*For any* network connectivity issue during authentication, the system should show appropriate connectivity error messages
**Validates: Requirements 4.5**

Property 16: Logout session clearing
*For any* logout action, the system should clear the authentication session and stored tokens
**Validates: Requirements 5.1, 5.3**

Property 17: Logout navigation
*For any* logout action (successful or failed), the system should redirect the user to the login page
**Validates: Requirements 5.2, 5.4**

## Error Handling

### Authentication Errors
- **Invalid Credentials**: "Email atau password salah. Silakan periksa kembali email dan password Anda."
- **Email Not Confirmed**: "Email belum dikonfirmasi. Silakan cek email Anda dan klik link konfirmasi terlebih dahulu."
- **Rate Limiting**: "Terlalu banyak percobaan login. Silakan tunggu beberapa menit sebelum mencoba lagi."
- **Network Issues**: "Koneksi internet bermasalah. Silakan periksa koneksi internet Anda dan coba lagi."
- **Server Errors**: "Terjadi kesalahan pada server. Silakan coba lagi dalam beberapa saat."

### Session Errors
- **Expired Token**: Automatic redirect to login page
- **Invalid Token**: Clear session and redirect to login
- **Missing Token**: Redirect to login page

### API Errors
- **401 Unauthorized**: Clear session and redirect to login
- **403 Forbidden**: Show access denied message
- **Network Timeout**: Show connectivity error message

## Testing Strategy

### Unit Testing
- Test individual authentication functions
- Test error message generation
- Test token storage and retrieval
- Test form validation logic

### Property-Based Testing
- Use Jest with fast-check library for property-based testing
- Configure each property-based test to run minimum 100 iterations
- Test authentication flows with random valid/invalid inputs
- Test session management with various token states
- Test API authentication with different token scenarios

### Integration Testing
- Test complete login/logout flows
- Test session persistence across page refreshes
- Test API authentication end-to-end
- Test error handling scenarios

### Manual Testing
- Test user experience flows
- Test accessibility features
- Test responsive design
- Test browser compatibility