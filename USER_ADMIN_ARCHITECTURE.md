# User Admin System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REVIEW CARD SYSTEM                               │
│                         WITH USER ADMIN ACCESS                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC ACCESS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /{slug}  →  Public Review Card Page                                    │
│              - AI-generated reviews                                      │
│              - Star ratings                                              │
│              - Google Maps integration                                   │
│              - Increments view_count                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     MAIN ADMIN ACCESS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /ai-login  →  Main Admin Login                                         │
│                - Mobile: 9426479677                                      │
│                - Password: yash@123                                      │
│                                                                          │
│  /ai-admin  →  Main Admin Dashboard                                     │
│                                                                          │
│    ┌─────────────────┬──────────────────┐                              │
│    │  Review Cards   │  User Admins     │  ← Tabs                      │
│    └─────────────────┴──────────────────┘                              │
│                                                                          │
│    Review Cards Tab:                                                    │
│    • Create/Edit/Delete cards                                           │
│    • Manage business details                                            │
│    • Set expiry dates                                                   │
│    • View analytics                                                     │
│    • QR code generation                                                 │
│    • Filters & search                                                   │
│                                                                          │
│    User Admins Tab: (NEW)                                               │
│    • Create user admin accounts                                         │
│    • Edit credentials                                                   │
│    • Delete accounts                                                    │
│    • Assign businesses                                                  │
│    • Activate/Deactivate                                                │
│                                                                          │
│  /ai-admin/analytics  →  System Analytics                               │
│                          - All business stats                            │
│                          - System-wide metrics                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     USER ADMIN ACCESS (NEW)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /{slug}/admin  →  User Admin Login                                     │
│                    - Email or Mobile                                     │
│                    - Password                                            │
│                    - Business slug validation                            │
│                    - 24-hour session                                     │
│                                                                          │
│  /{slug}/admin/dashboard  →  User Admin Dashboard                       │
│                               - Business info                            │
│                               - Total views                              │
│                               - Active/Inactive status                   │
│                               - Creation & expiry dates                  │
│                               - Services & description                   │
│                               - Link to live page                        │
│                               - READ-ONLY access                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         DATABASE STRUCTURE                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  review_cards (Existing)                                                 │
│  ├── id                                                                  │
│  ├── business_name                                                       │
│  ├── slug ──────────────┐                                                │
│  ├── category            │                                               │
│  ├── type                │                                               │
│  ├── description         │                                               │
│  ├── location            │                                               │
│  ├── services            │                                               │
│  ├── logo_url            │                                               │
│  ├── google_maps_url     │                                               │
│  ├── view_count          │                                               │
│  ├── active              │                                               │
│  ├── expires_at          │                                               │
│  ├── created_at          │                                               │
│  └── updated_at          │                                               │
│                          │                                               │
│  user_admins (NEW)       │                                               │
│  ├── id                  │                                               │
│  ├── email (UNIQUE)      │                                               │
│  ├── mobile (UNIQUE)     │                                               │
│  ├── password            │                                               │
│  ├── business_slug ──────┘ (FOREIGN KEY)                                 │
│  ├── full_name                                                           │
│  ├── is_active                                                           │
│  ├── created_at                                                          │
│  └── updated_at                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         ACCESS CONTROL FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Request: /{slug}/admin                                                  │
│     ↓                                                                    │
│  Is user authenticated?                                                  │
│     ├─ NO  → Redirect to /{slug}/admin (login page)                     │
│     └─ YES → Check business assignment                                   │
│         ├─ Match   → Show dashboard                                      │
│         └─ No Match → Access Denied                                      │
│                                                                          │
│  Request: /ai-admin                                                      │
│     ↓                                                                    │
│  Is main admin authenticated?                                            │
│     ├─ NO  → Redirect to /ai-login                                       │
│     └─ YES → Show admin dashboard (all tabs)                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Main Admin (auth.ts)                                                   │
│  ├── Storage: sessionStorage                                            │
│  ├── Key: 'review_admin_auth'                                           │
│  ├── Credentials: Environment variables                                 │
│  └── Methods: login(), logout(), isAuthenticated()                      │
│                                                                          │
│  User Admin (userAuth.ts) - NEW                                         │
│  ├── Storage: sessionStorage                                            │
│  ├── Key: 'user_admin_auth'                                             │
│  ├── Credentials: Database (user_admins table)                          │
│  ├── Session: 24-hour expiry                                            │
│  └── Methods:                                                            │
│      • login(emailOrMobile, password)                                   │
│      • logout()                                                          │
│      • isAuthenticated()                                                 │
│      • getCurrentUser()                                                  │
│      • getAllUserAdmins() [Main admin only]                             │
│      • createUserAdmin() [Main admin only]                              │
│      • updateUserAdmin() [Main admin only]                              │
│      • deleteUserAdmin() [Main admin only]                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT TREE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  App.tsx                                                                 │
│  ├── LoginPage (/ai-login)                                              │
│  ├── ProtectedRoute (/ai-admin)                                         │
│  │   └── AdminDashboard                                                  │
│  │       ├── Review Cards Tab                                            │
│  │       │   ├── CompactAddCardModal                                     │
│  │       │   ├── EditCardModal                                           │
│  │       │   ├── QRCodeModal                                             │
│  │       │   └── ConfirmDialog                                           │
│  │       └── User Admins Tab (NEW)                                       │
│  │           └── UserAdminManagement                                     │
│  │               ├── UserAdminModal                                      │
│  │               └── DeleteConfirmDialog                                 │
│  ├── ProtectedRoute (/ai-admin/analytics)                               │
│  │   └── AnalyticsDashboard                                              │
│  ├── UserAdminLogin (/{slug}/admin) - NEW                               │
│  ├── UserAdminDashboard (/{slug}/admin/dashboard) - NEW                 │
│  └── DynamicReviewCard (/{slug})                                        │
│      └── CompactReviewCardView                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEYS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Journey 1: Main Admin Creates User Admin                               │
│  ────────────────────────────────────────────                           │
│  1. Navigate to /ai-login                                                │
│  2. Enter mobile: 9426479677, password: yash@123                        │
│  3. Click "Sign In" → Redirected to /ai-admin                           │
│  4. Click "User Admins" tab                                              │
│  5. Click "Add User Admin" button                                        │
│  6. Fill form: email, mobile, password, select business                 │
│  7. Toggle "Active Status" to ON                                         │
│  8. Click "Create"                                                       │
│  9. User admin account created ✓                                         │
│                                                                          │
│  Journey 2: User Admin Logs In                                          │
│  ──────────────────────────────────                                     │
│  1. Navigate to /{slug}/admin (e.g., /coffee-shop/admin)                │
│  2. Enter email or mobile                                                │
│  3. Enter password                                                       │
│  4. Click "Sign In"                                                      │
│  5. System validates business assignment                                 │
│  6. Redirected to /{slug}/admin/dashboard                                │
│  7. View analytics (read-only) ✓                                         │
│                                                                          │
│  Journey 3: Public User Views Review Card                               │
│  ─────────────────────────────────────────                              │
│  1. Navigate to /{slug} (e.g., /coffee-shop)                            │
│  2. System increments view_count                                         │
│  3. AI generates reviews                                                 │
│  4. User sees reviews, ratings, map ✓                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY MEASURES                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✓ Session-based authentication                                         │
│  ✓ Business slug validation                                             │
│  ✓ Read-only access for user admins                                     │
│  ✓ Unique email/mobile constraints                                      │
│  ✓ Foreign key constraints                                              │
│  ✓ Row Level Security (RLS) on user_admins                              │
│  ✓ 24-hour session expiry                                               │
│  ✓ Automatic redirects on unauthorized access                           │
│                                                                          │
│  ⚠ TODO: Implement password hashing (bcrypt)                            │
│  ⚠ TODO: Add rate limiting                                              │
│  ⚠ TODO: Implement 2FA                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
