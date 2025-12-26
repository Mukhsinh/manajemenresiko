# Design Document

## Overview

This design document outlines the complete overhaul of the authentication system using modern Supabase best practices. The new system will replace the existing problematic authentication implementation with a robust, secure, and maintainable solution that follows Supabase's latest recommendations and patterns.

The design focuses on leveraging Supabase's built-in authentication capabilities, automatic session management, Row Level Security (RLS) policies, and reactive state management to create a seamless user experience while maintaining high security standards.

## Architecture

The new authentication system follows a modern client-server architecture with the following key components:

### Client-Side Architecture
1. **Supabase Client**: Official Supabase JavaScript client with automatic authentication handling
2. **Auth Context Provider**: React-style context for managing authentication state across the application
3. **Auth Service Layer**: Abstraction layer for authentication operations with error handling
4. **Route Protection**: Middleware for protecting routes and handling authentication redirects
5. **Session Management**: Automatic session persistence and restoration using Supabase's built-in capabilities

### Server-Side Architecture
1. **Supabase Auth Service**: Managed authentication service handling all auth operations
2. **Row Level Security (RLS)**: Database-level security policies for multi-tenant data isolation
3. **User Profile Management**: Integration with user_profiles table for extended user information
4. **Organization-Based Access Control**: Multi-tenant architecture with organization-based data filtering

### Security Architecture
1. **JWT Token Management**: Automatic token handling by Supabase client
2. **Session Persistence**: Secure session storage with automatic refresh
3. **Multi-Tenant Isolation**: RLS policies ensuring organization-based data separation
4. **Input Validation**: Client and server-side validation with sanitization
5. **Rate Limiting**: Protection against brute force attacks

## Components and Interfaces

### Frontend Components

#### AuthProvider
- **Purpose**: Global authentication state management using React Context pattern
- **Features**:
  - Reactive authentication state using Supabase's onAuthStateChange
  - Automatic session restoration on application load
  - User profile data management with organization information
  - Loading states and error handling
  - Logout functionality with complete state cleanup

#### AuthService
- **Purpose**: Centralized authentication operations with modern Supabase patterns
- **Methods**:
  - `signIn(email, password)`: Authenticate user with Supabase Auth
  - `signOut()`: Sign out user and clear all session data
  - `getCurrentUser()`: Get current authenticated user with profile data
  - `getSession()`: Get current session information
  - `onAuthStateChange(callback)`: Subscribe to authentication state changes

#### LoginForm
- **Purpose**: Modern login interface with validation and user feedback
- **Features**:
  - Real-time email and password validation
  - Loading states with Indonesian language feedback
  - Comprehensive error handling with localized messages
  - Form security with input sanitization
  - Rate limiting protection with user feedback

#### RouteGuard
- **Purpose**: Protect routes and handle authentication redirects
- **Features**:
  - Automatic authentication status checking
  - Redirect to login for unauthenticated users
  - Loading states during authentication verification
  - Support for public and protected routes

### Backend Components

#### Row Level Security Policies
- **Purpose**: Database-level security for multi-tenant data isolation
- **Policies**:
  - Organization-based filtering for all data tables
  - User profile access control
  - Super admin bypass capabilities
  - Performance-optimized policy implementation

#### User Profile Integration
- **Purpose**: Extended user information with organization context
- **Features**:
  - Automatic profile creation on user registration
  - Organization assignment and role management
  - Profile data synchronization with auth state
  - Multi-tenant organization isolation

## Data Models

### Authentication State
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}
```

### User Profile
```typescript
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user';
  organization_id: string;
  organization_name: string;
  organization_code: string;
  created_at: string;
  updated_at: string;
}
```

### Session Information
```typescript
interface SessionInfo {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
  provider_token?: string;
}
```

### Authentication Context
```typescript
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Flow Properties

Property 1: Successful authentication creates valid session
*For any* valid email and password combination, when authentication is performed through Supabase Auth, the system should create a valid session with proper user data and tokens
**Validates: Requirements 1.1**

Property 2: Automatic token storage
*For any* successful authentication, Supabase's built-in session management should automatically handle token storage and make tokens accessible for subsequent requests
**Validates: Requirements 1.2**

Property 3: Post-authentication navigation
*For any* successful authentication, the system should navigate to the dashboard and load organization-specific data correctly
**Validates: Requirements 1.3**

Property 4: Authentication error handling
*For any* authentication failure, the system should display appropriate Indonesian error messages based on the specific failure type
**Validates: Requirements 1.4**

Property 5: Auto-authentication for existing sessions
*For any* valid existing session, the system should automatically show the application interface without requiring re-login
**Validates: Requirements 1.5**

### Session Management Properties

Property 6: Session persistence across page refresh
*For any* authenticated user, refreshing the page should automatically restore the session and maintain the authenticated state
**Validates: Requirements 2.1**

Property 7: Auth state detection on load
*For any* application initialization, the system should use Supabase's onAuthStateChange listener to detect and restore existing sessions
**Validates: Requirements 2.2**

Property 8: Token expiration handling
*For any* expired authentication token, the Supabase client should automatically attempt token refresh or trigger re-authentication
**Validates: Requirements 2.3**

Property 9: Browser session persistence
*For any* valid session, closing and reopening the browser should restore the authentication state if the session is still valid
**Validates: Requirements 2.4**

Property 10: Session restoration error handling
*For any* session restoration failure, the system should gracefully redirect to the login page with appropriate messaging
**Validates: Requirements 2.5**

### API Authentication Properties

Property 11: Automatic token inclusion
*For any* database query through Supabase client, the system should automatically include authentication tokens without manual intervention
**Validates: Requirements 3.1**

Property 12: RLS enforcement
*For any* API call, the system should use Supabase's automatic Row Level Security enforcement for data access control
**Validates: Requirements 3.2**

Property 13: Token refresh handling
*For any* invalid or expired authentication token, the Supabase client should handle token refresh automatically or trigger re-authentication
**Validates: Requirements 3.3**

Property 14: User profile display
*For any* authenticated user, the system should correctly load and display the user's name, role, and organization information
**Validates: Requirements 3.4**

Property 15: Multi-tenant data isolation
*For any* organization-specific data access, the system should enforce multi-tenant isolation through RLS policies
**Validates: Requirements 3.5**

### User Interface Properties

Property 16: Form loading state management
*For any* login form submission, the system should show loading indicators and disable the form to prevent multiple submissions
**Validates: Requirements 4.1**

Property 17: Error message localization
*For any* login failure, the system should show specific Indonesian error messages based on the failure reason
**Validates: Requirements 4.4**

### Logout Properties

Property 18: Complete session clearing
*For any* logout action, the Supabase client should clear the authentication session completely
**Validates: Requirements 5.1**

Property 19: Post-logout navigation and cleanup
*For any* successful logout, the system should redirect to the login page and clear all cached user data
**Validates: Requirements 5.2**

Property 20: Token and session cleanup
*For any* logout action, the system should clear all stored authentication tokens and session data
**Validates: Requirements 5.3**

Property 21: Logout error handling
*For any* logout failure, the system should still redirect to login page for security and display appropriate error messages
**Validates: Requirements 5.4**

Property 22: Application state reset
*For any* logout action, the system should reset the application state to prevent data leakage between users
**Validates: Requirements 5.5**

### Security Properties

Property 23: Organization-based data filtering
*For any* authenticated user, the system should enforce RLS policies that filter data based on the user's organization_id
**Validates: Requirements 6.1**

Property 24: Automatic RLS filtering
*For any* data table access, the system should automatically apply organization-based filtering through RLS policies
**Validates: Requirements 6.2**

Property 25: Cross-organization access prevention
*For any* attempt to access data from another organization, the RLS policies should prevent access and return empty results
**Validates: Requirements 6.3**

Property 26: Super admin access
*For any* super admin user authentication, the system should allow access to all organizations' data based on their role
**Validates: Requirements 6.4**

### Validation Properties

Property 27: Email format validation
*For any* email input, the system should validate email format in real-time and show validation feedback
**Validates: Requirements 8.1**

Property 28: Password requirement enforcement
*For any* password input, the system should enforce minimum password requirements and show strength indicators
**Validates: Requirements 8.2**

Property 29: Invalid data submission prevention
*For any* invalid form data, the system should prevent submission and highlight validation errors
**Validates: Requirements 8.3**

Property 30: Rate limiting implementation
*For any* multiple failed login attempts, the system should implement rate limiting and show appropriate warnings
**Validates: Requirements 8.4**

Property 31: Input sanitization
*For any* form submission, the system should sanitize inputs and use secure transmission methods
**Validates: Requirements 8.5**

### Resilience Properties

Property 32: Network retry mechanisms
*For any* poor network connectivity, the system should implement retry mechanisms with exponential backoff
**Validates: Requirements 9.1**

Property 33: Service unavailability handling
*For any* temporary Supabase service unavailability, the system should show appropriate service status messages
**Validates: Requirements 9.2**

Property 34: Storage limitation handling
*For any* disabled browser storage, the system should gracefully degrade and inform the user of limitations
**Validates: Requirements 9.3**

Property 35: Concurrent session handling
*For any* concurrent sessions, the system should handle session conflicts appropriately
**Validates: Requirements 9.4**

Property 36: Inconsistency resolution
*For any* inconsistent authentication state, the system should detect and resolve the inconsistency automatically
**Validates: Requirements 9.5**

### Integration Properties

Property 37: Profile data loading
*For any* successful authentication, the system should load the user's profile data and organization information
**Validates: Requirements 10.1**

Property 38: Navigation state persistence
*For any* page navigation, the system should maintain authentication state without additional API calls
**Validates: Requirements 10.2**

Property 39: Route protection
*For any* protected route access, the system should verify authentication status and redirect if necessary
**Validates: Requirements 10.3**

Property 40: Application initialization
*For any* application initialization, the system should check authentication status and show appropriate UI state
**Validates: Requirements 10.4**

Property 41: Reactive user data updates
*For any* user data changes, the system should update the authentication context and refresh relevant UI components
**Validates: Requirements 10.5**

## Error Handling

### Authentication Errors
- **Invalid Credentials**: "Email atau password salah. Silakan periksa kembali email dan password Anda."
- **Email Not Confirmed**: "Email belum dikonfirmasi. Silakan cek email Anda dan klik link konfirmasi terlebih dahulu."
- **Rate Limiting**: "Terlalu banyak percobaan login. Silakan tunggu beberapa menit sebelum mencoba lagi."
- **Network Issues**: "Koneksi internet bermasalah. Silakan periksa koneksi internet Anda dan coba lagi."
- **Server Errors**: "Terjadi kesalahan pada server. Silakan coba lagi dalam beberapa saat."
- **Account Disabled**: "Akun Anda telah dinonaktifkan. Silakan hubungi administrator."
- **Invalid Email Format**: "Format email tidak valid. Contoh: user@example.com"
- **Weak Password**: "Password terlalu lemah. Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol."

### Session Errors
- **Expired Session**: Automatic redirect to login page with message "Sesi Anda telah berakhir. Silakan login kembali."
- **Invalid Session**: Clear session and redirect to login with message "Sesi tidak valid. Silakan login kembali."
- **Session Conflict**: Handle gracefully with message "Terdeteksi login dari perangkat lain. Sesi akan diperbarui."

### Network and Service Errors
- **Connection Timeout**: "Koneksi timeout. Silakan periksa koneksi internet Anda."
- **Service Unavailable**: "Layanan sedang tidak tersedia. Silakan coba lagi dalam beberapa menit."
- **Maintenance Mode**: "Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti."

## Testing Strategy

### Unit Testing
- Test individual authentication functions with mocked Supabase client
- Test error message generation and localization
- Test form validation logic and user input handling
- Test session state management and cleanup
- Test route protection and navigation logic

### Property-Based Testing
- Use Jest with fast-check library for property-based testing
- Configure each property-based test to run minimum 100 iterations
- Test authentication flows with random valid/invalid inputs
- Test session management with various token states and expiration scenarios
- Test RLS policies with different user roles and organization contexts
- Test error handling with various failure scenarios
- Test form validation with random input combinations

### Integration Testing
- Test complete authentication flows from login to dashboard
- Test session persistence across page refreshes and browser restarts
- Test multi-tenant data isolation with different organization users
- Test error handling scenarios with actual Supabase responses
- Test route protection with various authentication states

### End-to-End Testing
- Test user authentication journey from login to accessing protected features
- Test logout and session cleanup across different scenarios
- Test error recovery and user guidance flows
- Test responsive design and accessibility features

## Implementation Guidelines

### Supabase Client Configuration
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
```

### Authentication Context Pattern
```javascript
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
    initialized: false
  })

  useEffect(() => {
    // Initialize auth state and set up listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle auth state changes
    })
  }, [])

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Row Level Security Policies
```sql
-- User profiles policy
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Organization-based data access
CREATE POLICY "Users can access own organization data" ON risk_inputs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Super admin access
CREATE POLICY "Super admin can access all data" ON risk_inputs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### Error Handling Pattern
```javascript
const handleAuthError = (error) => {
  const errorMessages = {
    'Invalid login credentials': 'Email atau password salah. Silakan periksa kembali email dan password Anda.',
    'Email not confirmed': 'Email belum dikonfirmasi. Silakan cek email Anda dan klik link konfirmasi terlebih dahulu.',
    'Too many requests': 'Terlalu banyak percobaan login. Silakan tunggu beberapa menit sebelum mencoba lagi.',
    // ... more error mappings
  }
  
  return errorMessages[error.message] || 'Terjadi kesalahan saat login. Silakan coba lagi.'
}
```

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load user profile data only when needed
2. **Caching**: Cache user profile and organization data with appropriate TTL
3. **RLS Optimization**: Use indexed columns in RLS policies for better performance
4. **Connection Pooling**: Leverage Supabase's built-in connection pooling
5. **Query Optimization**: Use selective queries to minimize data transfer

### Monitoring and Metrics
1. **Authentication Success Rate**: Monitor login success/failure rates
2. **Session Duration**: Track average session lengths and patterns
3. **Error Rates**: Monitor different types of authentication errors
4. **Performance Metrics**: Track authentication response times
5. **Security Events**: Monitor suspicious authentication activities

## Security Considerations

### Best Practices Implementation
1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Defense in Depth**: Multiple layers of security (client, server, database)
3. **Input Validation**: Comprehensive validation and sanitization
4. **Rate Limiting**: Protection against brute force attacks
5. **Audit Logging**: Track authentication events for security monitoring

### Compliance and Standards
1. **GDPR Compliance**: Proper handling of personal data
2. **Password Security**: Enforce strong password requirements
3. **Session Security**: Secure session management with appropriate timeouts
4. **Data Encryption**: Ensure all data transmission is encrypted
5. **Access Logging**: Maintain audit trails for compliance requirements