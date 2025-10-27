# User Admin System Documentation

## Overview

The User Admin System allows the main administrator to create user-level admin accounts for individual businesses. Each user admin can access their assigned business's analytics dashboard through a personalized login.

## Architecture

### Routes

1. **Main Admin Routes** (Existing)

   - `/ai-login` - Main admin login
   - `/ai-admin` - Main admin dashboard (manage cards & user admins)
   - `/ai-admin/analytics` - System-wide analytics

2. **User Admin Routes** (New)

   - `/{slug}/admin` - User admin login for specific business
   - `/{slug}/admin/dashboard` - User admin analytics dashboard

3. **Public Routes**
   - `/{slug}` - Public review card page

### Database

New table: `user_admins`

```sql
CREATE TABLE public.user_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  mobile TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  business_slug TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (business_slug) REFERENCES review_cards(slug)
);
```

## Features

### Main Admin (`/ai-admin`)

The main admin dashboard now has two tabs:

1. **Review Cards Tab** (Default)

   - View all review cards
   - Create, edit, delete cards
   - Manage card settings
   - View analytics

2. **User Admins Tab** (New)
   - View all user admin accounts
   - Create new user admin accounts
   - Edit existing user admin credentials
   - Delete user admin accounts
   - Assign businesses to user admins
   - Activate/deactivate user admin accounts

### User Admin (`/{slug}/admin`)

User admins have:

1. **Login Page**

   - Email or mobile number login
   - Password authentication
   - Automatic business slug validation
   - Session management (24-hour expiry)

2. **Analytics Dashboard**
   - View business information
   - See total views
   - Check business status
   - View creation/expiry dates
   - See services and description
   - Read-only access (no editing)

## Usage Guide

### For Main Administrators

#### Creating a User Admin Account

1. Log in to `/ai-login` with main admin credentials
2. Navigate to `/ai-admin`
3. Click on the "User Admins" tab
4. Click "Add User Admin" button
5. Fill in the form:
   - **Full Name**: Display name for the user
   - **Email**: Unique email address (required)
   - **Mobile**: Unique mobile number (required)
   - **Password**: Login password (required)
   - **Assigned Business**: Select from dropdown (required)
   - **Active Status**: Toggle on/off
6. Click "Create" to save

#### Managing User Admin Accounts

- **Edit**: Click the edit icon to modify user details
- **Delete**: Click the trash icon to remove a user admin
- **View Stats**: See total, active, and inactive counts at the top

#### Best Practices

- Use strong passwords for user admin accounts
- Assign only one business per user admin
- Deactivate accounts instead of deleting when temporarily disabling access
- Keep email and mobile numbers unique across all user admins

### For User Administrators

#### Logging In

1. Navigate to `/{your-business-slug}/admin`
2. Enter your email OR mobile number
3. Enter your password
4. Click "Sign In"

> **Note**: You must use the correct business slug. You'll receive an error if you try to access a business you're not assigned to.

#### Viewing Analytics

Once logged in, you can:

- View total page views for your business
- See business status (Active/Inactive)
- Check business details (category, type, location)
- View services offered
- See creation and expiry dates
- Access the live review page (click "View Live Page")

#### Session Management

- Sessions expire after 24 hours
- You'll be automatically redirected to login when session expires
- Click "Logout" in the top-right to end session manually

## Security Features

### Authentication

- **Main Admin**: Session-based with environment variable credentials
- **User Admin**: Session-based with database credentials
- **Session Expiry**: 24 hours for user admin sessions
- **Route Protection**: Automatic redirects for unauthorized access

### Access Control

- User admins can only access their assigned business
- Attempting to access another business results in denial
- Read-only access for user admins (no editing capabilities)
- All CRUD operations reserved for main admin

### Data Protection

- Passwords stored as plain text (⚠️ **Note**: In production, use bcrypt or similar)
- Unique email and mobile constraints
- Foreign key constraints ensure data integrity
- Row Level Security (RLS) enabled on user_admins table

## Configuration

### Environment Variables

Main admin credentials (existing):

```env
VITE_ADMIN_MOBILE=9426479677
VITE_ADMIN_PASSWORD=yash@123
```

### Database Migration

Run the migration to create the `user_admins` table:

```bash
# Using Supabase CLI
supabase migration up

# Or manually execute
# supabase/migrations/20251015000000_create_user_admins.sql
```

## API Reference

### userAuth Utility

Located at: `src/utils/userAuth.ts`

#### Methods

```typescript
// Login user admin
userAuth.login(emailOrMobile: string, password: string): Promise<UserAdmin | null>

// Logout user admin
userAuth.logout(): void

// Check authentication status
userAuth.isAuthenticated(): boolean

// Get current logged-in user
userAuth.getCurrentUser(): UserAdmin | null

// Get all user admins (main admin only)
userAuth.getAllUserAdmins(): Promise<UserAdminData[]>

// Create user admin (main admin only)
userAuth.createUserAdmin(userData: object): Promise<boolean>

// Update user admin (main admin only)
userAuth.updateUserAdmin(id: string, updates: object): Promise<boolean>

// Delete user admin (main admin only)
userAuth.deleteUserAdmin(id: string): Promise<boolean>
```

## Components

### New Components

1. **UserAdminLogin** (`src/components/UserAdminLogin.tsx`)

   - Handles user admin authentication
   - Email/mobile + password login
   - Business slug validation

2. **UserAdminDashboard** (`src/components/UserAdminDashboard.tsx`)

   - Displays business analytics
   - Read-only interface
   - Session management

3. **UserAdminManagement** (`src/components/UserAdminManagement.tsx`)
   - CRUD operations for user admins
   - Embedded in main AdminDashboard
   - Business assignment

### Updated Components

1. **AdminDashboard** (`src/components/AdminDashboard.tsx`)

   - Added tab navigation
   - Integrated UserAdminManagement component

2. **App** (`src/App.tsx`)
   - Added user admin routes
   - Route ordering for proper matching

## Troubleshooting

### Common Issues

**Issue**: "Access denied" error when logging in

- **Solution**: Verify you're using the correct business slug in the URL
- **Solution**: Check that your account is active (ask main admin)

**Issue**: Can't see User Admins tab

- **Solution**: Ensure you're logged in as main admin at `/ai-admin`
- **Solution**: User admins don't have access to this tab

**Issue**: Session expired message

- **Solution**: Simply log in again at `/{slug}/admin`
- **Solution**: Sessions last 24 hours from login

**Issue**: "Supabase not configured" error

- **Solution**: Ensure Supabase environment variables are set
- **Solution**: Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Issue**: Duplicate email/mobile error when creating user

- **Solution**: Use unique email and mobile for each user admin
- **Solution**: Check existing users before creating new ones

## Future Enhancements

### Security

- [ ] Implement password hashing (bcrypt)
- [ ] Add password reset functionality
- [ ] Implement rate limiting for login attempts
- [ ] Add 2FA support

### Features

- [ ] Email notifications for new user admin accounts
- [ ] Allow user admins to change their password
- [ ] Add audit logs for user admin actions
- [ ] Implement role-based permissions
- [ ] Add multi-business support per user admin

### UI/UX

- [ ] Add forgot password flow
- [ ] Implement password strength meter
- [ ] Add user profile management
- [ ] Create onboarding tutorial for new user admins

## Support

For issues or questions:

1. Check this documentation first
2. Review the code comments in source files
3. Contact the main administrator
4. Visit: https://www.aireviewsystem.com/

---

**Last Updated**: October 15, 2025
**Version**: 1.0.0
