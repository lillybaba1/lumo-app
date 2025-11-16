# 🔧 Email Verification Troubleshooting Guide

## Issue: "Email Verification Failed"

When clicking the verification link in the email, users see an error page saying "Email Verification Failed".

---

## Common Causes & Solutions

### 1. **Incorrect Redirect URL in Environment**

**Problem**: `NEXT_PUBLIC_SITE_URL` doesn't match your current environment.

**Solution**:
```bash
# For local development (.env.local)
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# For production (Vercel environment variables)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

**Steps**:
1. Open `.env.local`
2. Update `NEXT_PUBLIC_SITE_URL` to `http://localhost:3001`
3. Restart dev server: `npm run dev`
4. Try signup again

---

### 2. **Supabase Redirect URLs Not Configured**

**Problem**: Supabase doesn't allow redirects to your local or production URL.

**Solution**:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add these URLs to **Redirect URLs**:
   ```
   http://localhost:3001/auth/callback
   http://localhost:3000/auth/callback
   https://your-domain.vercel.app/auth/callback
   ```
5. Add to **Site URL**:
   ```
   http://localhost:3001 (for development)
   https://your-domain.vercel.app (for production)
   ```
6. Save changes
7. Try signup again

---

### 3. **Email Verification Link Expired**

**Problem**: Verification links expire after a certain time (usually 24 hours).

**Solution**:
1. Go back to signup page
2. Enter the same email and password
3. Click "Create Account" again
4. A new verification email will be sent
5. Click the new link within 24 hours

---

### 4. **Code Already Used**

**Problem**: The verification code can only be used once.

**Solution**:
1. If you already verified, try logging in instead
2. Go to `/login`
3. Enter your email and password
4. Click "Login"

---

### 5. **Database Profile Creation Failed**

**Problem**: User was created in auth but profile wasn't created in database.

**Solution**:

The callback route now handles this automatically. If you still have issues:

1. Check Supabase dashboard → **Authentication** → **Users**
2. Find your user
3. Check if `email_confirmed_at` is set
4. If yes, but login fails:
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO user_profiles (id, email, name, role)
   VALUES (
     'user-uuid-here',
     'user@email.com',
     'User Name',
     'user'
   );
   ```

---

### 6. **Browser Cookies Blocked**

**Problem**: Browser is blocking cookies, preventing session creation.

**Solution**:
1. Check browser console for cookie errors
2. Enable third-party cookies (for development)
3. Try incognito/private mode
4. Clear all cookies for localhost
5. Try signup again

---

### 7. **CORS Issues**

**Problem**: Cross-origin request blocked.

**Solution**:

Update `next.config.mjs`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

---

## Debugging Steps

### Step 1: Check Server Logs

```bash
# Watch the terminal where dev server is running
# You should see:
Auth callback received: { code: 'present', origin: 'http://localhost:3001' }
Session created successfully: user-id-here
Redirecting to: http://localhost:3001/auth/verified
```

### Step 2: Check Browser Console

Open browser DevTools → Console tab:
- Look for errors related to auth or cookies
- Check Network tab for failed requests
- Look for redirect loops

### Step 3: Check Supabase Logs

1. Go to Supabase Dashboard
2. Click **Logs** → **Auth Logs**
3. Look for recent signup/verification events
4. Check for errors

### Step 4: Manually Test Verification

```bash
# Get verification link from email
# It should look like:
https://edsuvnlbviosnyxbjptx.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=http://localhost:3001/auth/callback

# Check components:
1. Base URL matches your Supabase project
2. Token is present
3. type=signup
4. redirect_to points to your callback route
```

---

## Testing the Fix

### Test 1: Fresh Signup

1. Stop dev server: `Ctrl+C`
2. Update `.env.local` with correct URL
3. Start dev server: `npm run dev`
4. Visit: `http://localhost:3001/signup`
5. Fill form and submit
6. Check email for verification link
7. Click link
8. Should redirect to `/auth/verified`
9. Should see success message
10. Name should appear in header

### Test 2: Check Profile Created

```bash
# Open Supabase SQL Editor and run:
SELECT * FROM user_profiles WHERE email = 'your-test-email@example.com';

# Should return:
# id, email, name, phone, role, created_at, updated_at
```

### Test 3: Login After Verification

1. Go to `/login`
2. Enter verified email and password
3. Click "Login"
4. Should redirect to homepage
5. Name should appear in header

---

## Prevention

### For Local Development

```bash
# Always use in .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Add to Supabase redirect URLs:
http://localhost:3001/auth/callback
http://localhost:3000/auth/callback
```

### For Production

```bash
# In Vercel environment variables
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Add to Supabase redirect URLs:
https://your-domain.vercel.app/auth/callback
```

### Email Template Configuration

In Supabase Dashboard → **Authentication** → **Email Templates**:

**Confirm signup template**:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

Make sure `{{ .ConfirmationURL }}` is present.

---

## Still Not Working?

### Check These:

1. ✅ Is Supabase project active?
2. ✅ Are environment variables correct?
3. ✅ Is redirect URL whitelisted in Supabase?
4. ✅ Is dev server running on correct port?
5. ✅ Are cookies enabled in browser?
6. ✅ Is email actually being sent? (Check spam)
7. ✅ Is verification link clicked within 24 hours?
8. ✅ Is this a fresh link (not used before)?

### Manual Verification (Emergency)

If all else fails, manually verify user in Supabase:

1. Go to Supabase Dashboard
2. **Authentication** → **Users**
3. Find user by email
4. Click user row
5. Set `email_confirmed_at` to current timestamp
6. User can now login

---

## Error Messages Explained

### "The link may have expired or is invalid"
- Link older than 24 hours
- Link already used
- Invalid token format
- Wrong project/environment

### "No code parameter provided"
- URL missing `?code=...` parameter
- Link was modified or truncated
- Email client removed parameters

### "No session created after code exchange"
- Supabase couldn't create session
- Database connection issue
- RLS policies blocking insert

### Error with details
- Check the error details shown on page
- Common: "Invalid redirect URL"
- Solution: Add URL to Supabase whitelist

---

## Quick Fix Checklist

- [ ] Updated `.env.local` with `http://localhost:3001`
- [ ] Restarted dev server
- [ ] Added redirect URLs to Supabase dashboard
- [ ] Cleared browser cookies
- [ ] Tried fresh signup with new email
- [ ] Checked verification link within 24 hours
- [ ] Verified email was sent (check spam)
- [ ] Checked server logs for errors
- [ ] Checked browser console for errors
- [ ] Checked Supabase auth logs

---

## Contact Support

If none of these solutions work:

1. Export error details from error page
2. Check browser console (F12)
3. Copy server logs from terminal
4. Share in GitHub Issues or Discord
5. Include:
   - Error message
   - Verification link (remove token)
   - Environment (local/production)
   - Browser used
   - Steps to reproduce

---

**Last Updated**: November 16, 2025  
**Related Docs**: `SIGNUP_FLOW_COMPLETE.md`, `CURRENT_STATUS.md`
