# User Admin System - Quick Start Guide

## What's New?

✅ **User-level admin accounts** - Assign business owners access to their analytics  
✅ **Personalized login** - Each business has its own admin login at `/{slug}/admin`  
✅ **Read-only analytics** - User admins can view stats but cannot edit  
✅ **Main admin controls** - Manage all user admin accounts from `/ai-admin`

## Quick Links

- **Main Admin Login**: `/ai-login`
- **Main Admin Dashboard**: `/ai-admin`
- **User Admin Login**: `/{your-business-slug}/admin`
- **User Admin Dashboard**: `/{your-business-slug}/admin/dashboard`

## Main Admin - How to Create a User Admin

1. Go to `/ai-admin`
2. Click **"User Admins"** tab (next to Review Cards)
3. Click **"Add User Admin"** button
4. Fill in:
   - Full Name
   - Email (unique)
   - Mobile (unique)
   - Password
   - Select Business from dropdown
   - Set Active status
5. Click **"Create"**

✅ Done! The user can now login at `/{slug}/admin`

## User Admin - How to Access Your Dashboard

1. Go to `/{your-business-slug}/admin`
2. Enter your email OR mobile number
3. Enter your password
4. Click **"Sign In"**

You'll see:

- 📊 Total views
- 📅 Business details
- ✅ Active/Inactive status
- 🔗 Link to live page

## Database Setup

Run this migration:

```bash
# File: supabase/migrations/20251015000000_create_user_admins.sql
```

Or apply via Supabase Dashboard:

1. Go to SQL Editor
2. Copy contents of migration file
3. Run query

## Files Changed/Added

### New Files

- ✅ `src/utils/userAuth.ts` - User authentication logic
- ✅ `src/components/UserAdminLogin.tsx` - Login page for users
- ✅ `src/components/UserAdminDashboard.tsx` - Analytics dashboard for users
- ✅ `src/components/UserAdminManagement.tsx` - CRUD interface in main admin
- ✅ `supabase/migrations/20251015000000_create_user_admins.sql` - Database table
- ✅ `USER_ADMIN_DOCUMENTATION.md` - Full documentation

### Updated Files

- ✅ `src/App.tsx` - Added user admin routes
- ✅ `src/components/AdminDashboard.tsx` - Added User Admins tab

## Key Features

### For Main Admin

- Create/edit/delete user admin accounts
- Assign specific business to each user
- Activate/deactivate accounts
- View all user admins in one place

### For User Admin

- Login with email or mobile
- View business analytics (read-only)
- See total views, status, dates
- Access live review page
- 24-hour session

## Security Notes

⚠️ **Important**: Passwords are currently stored as plain text in the database. For production, implement proper password hashing (bcrypt).

## Example Usage

### Create a User Admin for "Coffee Shop"

1. Main admin creates account:

   - Email: `owner@coffeeshop.com`
   - Mobile: `9876543210`
   - Password: `coffee123`
   - Business: `coffee-shop`

2. User logs in at: `/coffee-shop/admin`

3. User sees analytics for Coffee Shop only

4. User cannot edit anything (read-only)

## Testing

### Test the Main Admin

```
URL: /ai-admin
Login: (existing main admin credentials)
Action: Go to "User Admins" tab → Add new user
```

### Test User Admin

```
URL: /{slug}/admin
Login: (credentials created by main admin)
Action: View analytics dashboard
```

## Troubleshooting

**Can't see User Admins tab?**
→ Make sure you're logged in as main admin at `/ai-admin`

**Access denied error?**
→ Check you're using the correct business slug in URL

**Session expired?**
→ Just log in again (sessions last 24 hours)

**Duplicate email/mobile error?**
→ Each user admin needs unique email and mobile

## Need Help?

📚 Full documentation: `USER_ADMIN_DOCUMENTATION.md`  
🌐 Website: https://www.aireviewsystem.com/

---

**Created**: October 15, 2025  
**Status**: ✅ Ready to use
