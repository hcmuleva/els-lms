# Demo Credentials - Quick Reference

## Login Credentials

### Superadmin
- **Email**: superadmin@example.com
- **Password**: admin123
- **Role**: Super Admin

### Admin
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: Admin

### Teacher
- **Email**: teacher@example.com
- **Password**: teacher123
- **Role**: Teacher

### Student
- **Email**: student@example.com
- **Password**: student123
- **Role**: Student

### Parent
- **Email**: parent@example.com
- **Password**: parent123
- **Role**: Parent

## Quick Login

On the login page, click any of the demo credential buttons to auto-fill the email and password fields.

## Registration

To test registration:
1. Go to http://localhost:3030/register
2. Fill in:
   - Full Name
   - Email
   - Select Role (from dropdown)
   - Password
   - Confirm Password
3. Click "Create Account"
4. Check browser console for registration payload
5. You will be redirected to login page

## Features to Test

✓ Login with hardcoded users
✓ Register new user (payload logged to console)
✓ Homepage greeting with user role
✓ Navbar with logo, alerts, role selector, and profile
✓ Profile dropdown with options
✓ Role-based dashboard cards
✓ Sign out functionality
✓ Responsive design (test on mobile)
