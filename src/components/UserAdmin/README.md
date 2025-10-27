# User Admin Components

This folder contains all components related to the User Admin system, which allows business owners to access their own analytics dashboards.

## Components

### 1. **UserAdminLogin.tsx**
Login page for user-level administrators.
- **Route**: `/{slug}/admin`
- **Features**:
  - Email or mobile number authentication
  - Password input with show/hide toggle
  - Business slug validation
  - Error handling
  - Auto-redirect if already authenticated

### 2. **UserAdminDashboard.tsx**
Analytics dashboard for user admins (read-only).
- **Route**: `/{slug}/admin/dashboard`
- **Features**:
  - Display business information
  - Show total views
  - Display active/inactive status
  - Show creation and expiry dates
  - View services and description
  - Link to live review page
  - Session management
  - Access control (business-specific)

### 3. **UserAdminManagement.tsx**
Management interface for main admin to manage user admin accounts.
- **Location**: Embedded in `/ai-admin` dashboard (User Admins tab)
- **Features**:
  - View all user admin accounts
  - Create new user admin accounts
  - Edit existing user accounts
  - Delete user accounts
  - Assign businesses to users
  - Activate/deactivate accounts
  - Statistics display

## File Structure

```
UserAdmin/
├── index.ts                    # Barrel export file
├── UserAdminLogin.tsx          # Login component
├── UserAdminDashboard.tsx      # Dashboard component
├── UserAdminManagement.tsx     # Management component
└── README.md                   # This file
```

## Import Usage

```typescript
// Import all components
import { 
  UserAdminLogin, 
  UserAdminDashboard, 
  UserAdminManagement 
} from './components/UserAdmin';

// Import specific component
import { UserAdminLogin } from './components/UserAdmin';
```

## Dependencies

- **Utils**: `userAuth.ts` - Authentication and CRUD operations
- **Types**: `ReviewCard` from `types/index.ts`
- **Storage**: `storage.ts` - Data management
- **Icons**: `lucide-react` - UI icons

## Routes

```typescript
// In App.tsx
<Route path="/:slug/admin" element={<UserAdminLogin />} />
<Route path="/:slug/admin/dashboard" element={<UserAdminDashboard />} />
```

## Authentication Flow

```
User navigates to /{slug}/admin
         ↓
UserAdminLogin component loads
         ↓
User enters email/mobile + password
         ↓
userAuth.login() validates credentials
         ↓
Check if business slug matches user's assigned business
         ↓
If match: Redirect to /{slug}/admin/dashboard
If no match: Show error and logout
```

## Access Control

- **UserAdminLogin**: Public (unauthenticated users only)
- **UserAdminDashboard**: Protected (authenticated user admins only)
- **UserAdminManagement**: Protected (main admin only)

## Styling

All components use:
- **Tailwind CSS** for styling
- **Gradient backgrounds** (slate-900, purple-900)
- **Glass-morphism effects** (backdrop-blur, white/10 opacity)
- **Responsive design** (mobile-first approach)
- **Consistent color scheme** (blue, purple, pink gradients)

## Security Features

- Session-based authentication (24-hour expiry)
- Business slug validation
- Read-only access for user admins
- Automatic logout on session expiry
- Protected routes with navigation guards

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email notifications
- [ ] User profile management
- [ ] Multi-business support per user
- [ ] Activity logs
- [ ] Two-factor authentication

## Notes

- All paths use `../../` for imports (relative to UserAdmin folder)
- Components are fully typed with TypeScript
- Error handling is implemented throughout
- Loading states are provided for better UX

---

**Last Updated**: October 17, 2025
**Maintained by**: Main Development Team
