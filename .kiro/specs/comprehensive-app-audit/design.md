# Design Document - Comprehensive Application Audit

## Overview

This design document outlines the comprehensive audit and repair strategy for the Risk Management Application. The application is a multi-tenant, multi-user system built with Node.js/Express backend and vanilla JavaScript frontend, using Supabase (PostgreSQL) as the database with Row Level Security (RLS) for data isolation.

The audit will systematically verify and fix all critical functionality including:
- Authentication and authorization flows
- User management with immediate UI updates
- Data import/export functionality
- Chart and visualization rendering
- Multi-tenant data isolation
- CRUD operations across all modules
- Real-time chat functionality
- Error handling and logging

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   UI Layer   │  │   Services   │  │   Modules    │     │
│  │  (HTML/CSS)  │  │ (Auth/API)   │  │ (Features)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Express    │  │  Middleware  │  │    Routes    │     │
│  │    Server    │  │  (Auth/Sec)  │  │  (Endpoints) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase Client
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase/PostgreSQL                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth System │  │   Database   │  │     RLS      │     │
│  │              │  │    Tables    │  │   Policies   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

1. **Service Layer Pattern**: Frontend uses service modules (authService, apiService) to abstract API calls
2. **Middleware Chain**: Backend uses Express middleware for authentication, security headers, and error handling
3. **Row Level Security**: Database-level multi-tenancy using Supabase RLS policies
4. **Organization-based Filtering**: Utility functions to automatically filter queries by user's organizations
5. **Module Pattern**: Frontend features are organized as self-contained modules

## Components and Interfaces

### Frontend Components

#### 1. Authentication Service (`public/js/services/authService.js`)
```javascript
interface AuthService {
  checkAuth(): Promise<AuthResult>
  login(email: string, password: string): Promise<LoginResult>
  register(email: string, password: string, fullName: string): Promise<RegisterResult>
  logout(): Promise<LogoutResult>
  getCurrentUser(): Promise<UserResult>
  onAuthStateChange(callback: Function): Subscription
}
```

#### 2. API Service (`public/js/services/apiService.js`)
```javascript
interface APIService {
  apiCall(endpoint: string, options: RequestOptions): Promise<any>
  get(endpoint: string, options?: RequestOptions): Promise<any>
  post(endpoint: string, data: any, options?: RequestOptions): Promise<any>
  put(endpoint: string, data: any, options?: RequestOptions): Promise<any>
  delete(endpoint: string, options?: RequestOptions): Promise<any>
  getAuthToken(): Promise<string | null>
}
```

#### 3. Feature Modules
Each feature module (dashboard, risk-input, master-data, etc.) follows this interface:
```javascript
interface FeatureModule {
  load(): Promise<void>
  init(): void
  // Feature-specific methods
}
```

### Backend Components

#### 1. Authentication Middleware (`middleware/auth.js`)
```javascript
interface AuthMiddleware {
  authenticateUser(req, res, next): Promise<void>
  checkOrganizationAccess(req, res, next): Promise<void>
}
```

#### 2. Route Handlers
All routes follow Express router pattern:
```javascript
router.get|post|put|delete(path, authenticateUser, async (req, res, next) => {
  // Handler logic
})
```

#### 3. Organization Utilities (`utils/organization.js`)
```javascript
interface OrganizationUtils {
  getUserOrganizations(userId: string): Promise<string[]>
  checkOrganizationAccess(userId: string, orgId: string): Promise<boolean>
  isSuperAdmin(user: User): Promise<boolean>
  getUserRole(user: User): Promise<string>
  buildOrganizationFilter(query: QueryBuilder, user: User): QueryBuilder
}
```

## Data Models

### Core Entities

#### User Profile
```typescript
interface UserProfile {
  id: UUID              // Primary key, references auth.users
  email: string
  full_name: string
  role: 'superadmin' | 'admin' | 'manager'
  organization_id?: UUID
  organization_code?: string
  organization_name?: string
  created_at: timestamp
  updated_at: timestamp
}
```

#### Organization
```typescript
interface Organization {
  id: UUID
  name: string
  code: string
  description?: string
  created_at: timestamp
  updated_at: timestamp
}
```

#### Organization User (Junction Table)
```typescript
interface OrganizationUser {
  id: UUID
  organization_id: UUID  // FK to organizations
  user_id: UUID          // FK to auth.users
  role: 'admin' | 'manager' | 'member'
  created_at: timestamp
}
```

#### Risk Input
```typescript
interface RiskInput {
  id: UUID
  user_id: UUID
  organization_id?: UUID
  no: number
  kode_risiko: string
  status_risiko: string
  jenis_risiko: string
  kategori_risiko_id: UUID
  nama_unit_kerja_id: UUID
  sasaran_strategis: string
  tanggal_registrasi: date
  penyebab_risiko: text
  dampak_risiko: text
  pihak_terkait: text
  // ... additional fields
  created_at: timestamp
  updated_at: timestamp
}
```

#### Master Data Tables
- `master_probability_criteria`: 5 levels of probability
- `master_impact_criteria`: 5 levels of impact
- `master_risk_categories`: 8 risk categories
- `master_work_units`: Organizational work units

#### Analysis Tables
- `risk_inherent_analysis`: Inherent risk calculations
- `risk_residual_analysis`: Residual risk after treatment
- `risk_treatments`: Risk treatment plans
- `risk_appetite`: Risk appetite levels
- `risk_monitoring`: Risk monitoring data

#### Chat Messages
```typescript
interface OrganizationChatMessage {
  id: UUID
  organization_id: UUID
  user_id: UUID
  message: text
  attachments?: jsonb
  created_at: timestamp
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Properties

**Property 1: Valid credentials create session**
*For any* valid email and password combination, when a user attempts to login, the system should return a valid session token and user object.
**Validates: Requirements 1.1**

**Property 2: Invalid credentials are rejected**
*For any* invalid credential combination (wrong password, non-existent email, malformed input), the system should reject authentication and return an appropriate error message.
**Validates: Requirements 1.2**

**Property 3: Logout invalidates session**
*For any* authenticated user, when they logout, their session token should become invalid and subsequent API calls with that token should fail with 401 Unauthorized.
**Validates: Requirements 1.4**

**Property 4: Registration creates complete user**
*For any* valid registration data (email, password, full_name), the system should create both an auth user and a user_profile record with matching IDs.
**Validates: Requirements 1.5**

### User Management Properties

**Property 5: User updates persist and reflect**
*For any* user record and valid update data, when an administrator updates the user, the changes should persist in the database and be reflected in subsequent queries.
**Validates: Requirements 2.2**

**Property 6: User deletion revokes access**
*For any* user in an organization, when an administrator deletes them from the organization, they should no longer appear in the organization's user list and should lose access to that organization's data.
**Validates: Requirements 2.3**

**Property 7: Organization filtering in user lists**
*For any* administrator viewing the user management page, the system should display only users belonging to organizations the administrator has access to (or all users if superadmin).
**Validates: Requirements 2.4**

### Data Import/Export Properties

**Property 8: Valid form data saves correctly**
*For any* valid risk input data submitted through the form, the system should validate, save to database, and return the created record with a generated ID.
**Validates: Requirements 3.1**

**Property 9: Excel import parses and validates**
*For any* Excel file with valid data structure, the import function should parse all rows, validate each field, and return either success with imported count or specific error messages for invalid rows.
**Validates: Requirements 3.2, 3.3**

**Property 10: Import success shows count**
*For any* successful import operation, the system should display a success message containing the exact count of records imported.
**Validates: Requirements 3.4**

**Property 11: Data associates with organization**
*For any* data creation operation (risk, master data, etc.), the system should automatically associate the record with the user's organization_id.
**Validates: Requirements 3.5**

**Property 12: Reports filter by organization**
*For any* report generation request, the system should include only data belonging to the user's organizations (or all data if superadmin).
**Validates: Requirements 4.3**

### Navigation and UI Properties

**Property 13: Menu navigation loads correct data**
*For any* menu item clicked, the system should navigate to the corresponding page and load data specific to that page and filtered by the user's organization.
**Validates: Requirements 6.1, 6.3**

**Property 14: Authentication persists across navigation**
*For any* authenticated user navigating between pages, the authentication state should remain valid and the user should not be logged out.
**Validates: Requirements 6.2**

**Property 15: Restricted page authorization**
*For any* user attempting to access a restricted page (e.g., pengaturan), the system should verify the user has the required role (superadmin) and redirect to dashboard if unauthorized.
**Validates: Requirements 6.5**

**Property 16: Chart filtering updates all charts**
*For any* filter applied on a page with multiple charts, all charts on that page should update to reflect the filtered dataset.
**Validates: Requirements 5.5**

### Multi-tenant Properties

**Property 17: Automatic organization filtering**
*For any* data query (GET request), the system should automatically apply organization-based filtering using the buildOrganizationFilter utility, unless the user is a superadmin.
**Validates: Requirements 7.1, 7.2**

**Property 18: Organization association on create**
*For any* data creation operation, the system should automatically set the organization_id field to the user's organization (or resolve from related entities like work unit).
**Validates: Requirements 7.3**

### Error Handling Properties

**Property 19: API errors return structured responses**
*For any* API request that fails (validation error, database error, not found, etc.), the system should return a JSON response with an error field and appropriate HTTP status code (400, 404, 500, etc.).
**Validates: Requirements 8.1**

**Property 20: Validation errors show field-specific messages**
*For any* form submission with validation errors, the system should return error messages that specify which fields failed validation and why.
**Validates: Requirements 8.3**

**Property 21: Error logs include context**
*For any* error that is logged, the log entry should include timestamp, user ID (if authenticated), request path, and error details.
**Validates: Requirements 8.5**

### CRUD Properties

**Property 22: Create operations return new record**
*For any* valid create operation across all entity types (risks, master data, organizations, etc.), the system should validate, insert into database, and return the complete created record including generated ID and timestamps.
**Validates: Requirements 9.1**

**Property 23: Read operations format correctly**
*For any* read operation, the system should fetch data from database and return it with correct data types, formatted dates, and joined related data where specified.
**Validates: Requirements 9.2**

**Property 24: Update operations persist changes**
*For any* valid update operation, the system should validate changes, update the database, update the updated_at timestamp, and return the updated record.
**Validates: Requirements 9.3**

**Property 25: Delete operations remove records**
*For any* delete operation, the system should remove the record from the database and return success, and subsequent queries should not return the deleted record.
**Validates: Requirements 9.4**

**Property 26: Referential integrity maintained**
*For any* CRUD operation involving foreign keys (e.g., risk_input_id in analysis tables), the system should maintain referential integrity and prevent orphaned records.
**Validates: Requirements 9.5**

### Chat Properties

**Property 27: Messages save and display**
*For any* message sent by a user, the system should save it to organization_chat_messages table with correct organization_id and user_id, and return the saved message for display.
**Validates: Requirements 10.1**

**Property 28: Chat history filters by organization**
*For any* user loading chat, the system should return only messages where organization_id matches one of the user's organizations.
**Validates: Requirements 10.3**

**Property 29: Cross-organization chat blocked**
*For any* user attempting to send or view messages for an organization they don't belong to, the system should return an error and prevent the operation.
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Authentication Errors** (401)
   - Invalid or expired token
   - Missing authorization header
   - User not found

2. **Authorization Errors** (403)
   - Insufficient permissions
   - Organization access denied
   - Role-based access denied

3. **Validation Errors** (400)
   - Missing required fields
   - Invalid data types
   - Business rule violations

4. **Not Found Errors** (404)
   - Resource not found
   - User not found
   - Organization not found

5. **Server Errors** (500)
   - Database connection failures
   - Unexpected exceptions
   - External service failures

### Error Response Format

All API errors follow this structure:
```json
{
  "error": "Human-readable error message",
  "details": "Optional additional details",
  "field": "Optional field name for validation errors"
}
```

### Error Logging Strategy

- All errors are logged using the logger utility
- Logs include: timestamp, level (error/warn), user context, request details, stack trace
- Client-side errors are logged to console with console.error()
- Server-side errors are logged to stdout/stderr (captured by hosting platform)

### Frontend Error Handling

- API service catches all fetch errors and throws Error objects
- Components catch errors and display user-friendly messages
- Authentication errors (401) trigger automatic logout and redirect to login
- Form validation errors are displayed inline next to fields

### Backend Error Handling

- Express error handling middleware catches all errors
- Custom error classes (AuthenticationError, ValidationError, NotFoundError) map to HTTP status codes
- Database errors are caught and logged with full details
- Unhandled promise rejections are logged and don't crash the server

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Authentication Tests**
   - Test login with valid credentials
   - Test login with invalid credentials
   - Test registration creates user profile
   - Test logout clears session

2. **API Endpoint Tests**
   - Test each CRUD endpoint with valid data
   - Test endpoints return correct status codes
   - Test error responses have correct structure

3. **Utility Function Tests**
   - Test buildOrganizationFilter with different user roles
   - Test getUserOrganizations returns correct IDs
   - Test isSuperAdmin correctly identifies superadmins

4. **Data Validation Tests**
   - Test validateRequestBody with valid/invalid data
   - Test Excel parsing with various file formats
   - Test data normalization functions

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library for JavaScript:

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment tag in this exact format:
```javascript
// **Feature: comprehensive-app-audit, Property X: [property description]**
```

1. **Authentication Properties** (Properties 1-4)
   - Generate random valid/invalid credentials
   - Test session token validity
   - Test logout invalidation
   - Test registration completeness

2. **User Management Properties** (Properties 5-7)
   - Generate random user data for updates
   - Test deletion and access revocation
   - Test organization filtering

3. **Data Import/Export Properties** (Properties 8-12)
   - Generate random valid risk data
   - Generate random Excel files
   - Test organization association
   - Test report filtering

4. **Navigation Properties** (Properties 13-16)
   - Test all menu items
   - Test authentication persistence
   - Test authorization checks
   - Test chart filtering

5. **Multi-tenant Properties** (Properties 17-18)
   - Generate random organization scenarios
   - Test automatic filtering
   - Test automatic association

6. **Error Handling Properties** (Properties 19-21)
   - Generate various error scenarios
   - Test error response structure
   - Test error logging

7. **CRUD Properties** (Properties 22-26)
   - Generate random entity data
   - Test all CRUD operations
   - Test referential integrity

8. **Chat Properties** (Properties 27-29)
   - Generate random messages
   - Test organization filtering
   - Test cross-org access blocking

### Integration Testing

Integration tests will verify end-to-end flows:

1. **Complete User Journey**
   - Register → Login → Create Data → View Reports → Logout

2. **Multi-tenant Isolation**
   - Create multiple organizations
   - Verify data isolation between organizations
   - Verify superadmin can access all data

3. **Import/Export Flow**
   - Download template → Fill data → Import → Verify in database → Export → Verify exported data

4. **Chart Rendering**
   - Create test data → Navigate to dashboard → Verify charts render → Apply filters → Verify charts update

### Manual Testing Checklist

1. **Authentication Flow**
   - [ ] Login with valid credentials
   - [ ] Login with invalid credentials shows error
   - [ ] Register new user
   - [ ] Logout clears session

2. **User Management**
   - [ ] Add new user to organization
   - [ ] Verify user appears in list immediately
   - [ ] Update user information
   - [ ] Delete user from organization

3. **Data Import**
   - [ ] Download template for each master data type
   - [ ] Import valid Excel file
   - [ ] Import invalid Excel file shows errors
   - [ ] Verify imported data appears in lists

4. **Data Export**
   - [ ] Export each report type
   - [ ] Verify exported data is correct
   - [ ] Verify organization filtering in exports

5. **Charts and Visualizations**
   - [ ] Navigate to dashboard
   - [ ] Verify all charts render
   - [ ] Apply filters
   - [ ] Verify charts update

6. **Navigation**
   - [ ] Click each menu item
   - [ ] Verify correct page loads
   - [ ] Verify data loads for each page
   - [ ] Verify authentication persists

7. **Multi-tenant**
   - [ ] Create multiple organizations
   - [ ] Add users to different organizations
   - [ ] Verify users only see their organization's data
   - [ ] Login as superadmin
   - [ ] Verify superadmin sees all data

8. **Chat**
   - [ ] Send message in chat
   - [ ] Verify message appears
   - [ ] Verify only organization members see message
   - [ ] Verify cross-org messages are blocked

9. **Error Handling**
   - [ ] Submit invalid form data
   - [ ] Verify field-level errors appear
   - [ ] Trigger API errors
   - [ ] Verify error messages are user-friendly
   - [ ] Check console/logs for error details

### Test Environment Setup

1. **Database**: Use separate Supabase project for testing or local PostgreSQL with same schema
2. **Test Data**: Seed database with test organizations, users, and sample data
3. **Test Users**: Create test accounts with different roles (superadmin, admin, manager)
4. **Cleanup**: Reset database between test runs to ensure consistency

### Continuous Testing

- Run unit tests on every code change
- Run property tests before each commit
- Run integration tests before deployment
- Perform manual testing checklist before major releases

## Implementation Notes

### Known Issues to Fix

Based on the documentation review, these issues need to be addressed:

1. **User Management Preview Issue**
   - Problem: Newly added users don't appear in the user list immediately
   - Root Cause: Likely missing UI refresh after user creation
   - Fix: Ensure user list is reloaded after successful user creation

2. **Import Data Errors**
   - Problem: Import function has errors
   - Root Cause: Need to investigate specific error scenarios
   - Fix: Add comprehensive error handling and validation in import functions

3. **Master Work Units Empty**
   - Problem: master_work_units table is empty
   - Fix: Provide UI to add work units or seed with default data

### MCP Tool Integration

The audit should leverage MCP (Model Context Protocol) tools for:
- Database inspection and verification
- API endpoint testing
- Log analysis
- Performance monitoring

### Security Considerations

1. **RLS Policies**: Verify all tables have correct RLS policies
2. **Service Role Key**: Ensure SUPABASE_SERVICE_ROLE_KEY is properly secured
3. **Input Validation**: All user inputs must be validated server-side
4. **SQL Injection**: Use parameterized queries (Supabase client handles this)
5. **XSS Prevention**: Sanitize user-generated content before display
6. **CSRF Protection**: Implement CSRF tokens for state-changing operations

### Performance Considerations

1. **Database Indexes**: Ensure indexes exist on frequently queried columns
2. **Query Optimization**: Use select() to fetch only needed columns
3. **Pagination**: Implement pagination for large lists
4. **Caching**: Cache master data and user organizations
5. **Lazy Loading**: Load charts and heavy components only when needed

### Deployment Checklist

1. [ ] All environment variables configured
2. [ ] Database migrations applied
3. [ ] RLS policies verified
4. [ ] Master data seeded
5. [ ] All tests passing
6. [ ] Error logging configured
7. [ ] Performance monitoring enabled
8. [ ] Backup strategy in place
