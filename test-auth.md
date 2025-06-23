# Authentication System Test Guide

## Fixed Import Issues
- Changed `@/db` to `@/lib/db` in all auth-related files
- Added re-exports in `src/db/schema/index.ts` for easier imports

## Testing Steps

1. **Test Signup Flow**
   - Navigate to http://localhost:3013/signup
   - Create a new account with:
     - Email: test@example.com
     - Password: Test123!@# (meets all requirements)
   - Should redirect to dashboard after successful signup

2. **Test Login Flow**
   - Navigate to http://localhost:3013/login
   - Login with the created credentials
   - Should redirect to dashboard

3. **Test Protected Routes**
   - Try accessing http://localhost:3013/dashboard without login
   - Should redirect to login page
   - Try accessing http://localhost:3013/profile without login
   - Should redirect to login page

4. **Test Profile Management**
   - When logged in, navigate to /profile
   - Test updating name
   - Test changing password

5. **Test Logout**
   - Click "Sign Out" button in navigation
   - Should redirect to home page
   - Protected routes should no longer be accessible

## Database Check
You can verify users are created in the database by checking the users table in your PostgreSQL database.