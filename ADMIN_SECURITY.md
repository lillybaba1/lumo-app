# Admin Security Documentation

## Question: Can Any User Become Admin?

**Answer: NO** - Multiple security layers prevent unauthorized admin access.

## Security Measures in Place

### 1. Setup First Admin (`/api/admin/setup-first-admin`) - **DISABLED**

**Status:** ⛔ **PERMANENTLY DISABLED FOR SECURITY**

**Previous Purpose:** Create the very first admin account when setting up the store.

**Why Disabled:**
- Potential security risk if left accessible
- Better to require server-level access for admin creation
- Prevents any web-based admin creation attacks

**Current Behavior:**
- Always returns 403 Forbidden
- Logs security warning when accessed
- Provides instructions for proper admin creation methods

**Code:**
```typescript
export async function POST(request: NextRequest) {
  // SECURITY: This endpoint has been permanently disabled
  console.warn('[SECURITY] Attempt to access disabled setup-first-admin endpoint');

  return NextResponse.json(
    {
      error: 'This endpoint has been disabled for security reasons.',
      message: 'Admin accounts can only be created by existing admins or server administrators.',
    },
    { status: 403 }
  );
}
```

### 2. Promote User API (`/api/admin/promote-user`)

**Purpose:** Allow existing admins to promote other users.

**Security:**
- ✅ **Requires authentication** - User must be logged in
- ✅ **Requires admin role** - Only existing admins can promote users
- ✅ **Database verification** - Role is checked from Supabase users table
- ✅ **Cannot self-demote** - Prevents admins from removing their own admin access

**Code:**
```typescript
// Check if requester is authenticated and is an admin
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json(
    { error: 'Unauthorized. Please log in.' },
    { status: 401 }
  );
}

// Verify admin role from database
const requesterProfile = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (!requesterProfile.data || requesterProfile.data.role !== 'admin') {
  return NextResponse.json(
    { error: 'Forbidden. Only admins can promote users.' },
    { status: 403 }
  );
}
```

### 3. Promote User by ID (`/api/admin/users/[id]/promote`)

**Purpose:** Promote a specific user by their ID (admin panel functionality).

**Security:**
- ✅ **Requires admin authentication** - Uses `requireAdmin()` helper
- ✅ **Redirects non-admins** - Automatically redirects to login if not authenticated
- ✅ **Cannot self-promote** - Prevents manipulation of own admin status
- ✅ **Audit logging** - Logs all promotion actions for security tracking

**Code:**
```typescript
// SECURITY: Require admin authentication
const adminUser = await requireAdmin({ redirect: false });

// Prevent self-promotion
if (userId === adminUser.userId) {
  return NextResponse.json({
    success: false,
    message: 'Cannot modify your own admin status'
  }, { status: 400 });
}
```

### 4. Server-Side Script (`scripts/promote-to-admin.mjs`)

**Purpose:** Command-line tool for server administrators.

**Security:**
- ✅ **Requires server access** - Must have direct access to server/filesystem
- ✅ **Requires environment variables** - Needs `SUPABASE_SERVICE_ROLE_KEY`
- ✅ **Not accessible via web** - Cannot be called through HTTP/browser
- ✅ **Intended for deployment/migration** - Used by system administrators only

**Access Required:**
- SSH/terminal access to server
- Access to `.env.local` file with service role key
- Command-line execution rights

### 5. Admin Layout Protection (`src/app/admin/layout.tsx`)

**Purpose:** Protect all admin pages with authentication.

**Security:**
- ✅ **Server-side verification** - Checks authentication on every admin page load
- ✅ **Requires admin role** - Uses `requireAdmin()` to verify role from database
- ✅ **Automatic redirect** - Sends non-admins to login page
- ✅ **No client-side bypass** - Runs on server, not in browser

### 6. Middleware Protection (`src/middleware.ts` + `src/lib/supabase/middleware.ts`)

**Purpose:** Intercept all `/admin/*` requests before they reach pages.

**Security:**
- ✅ **Route-level protection** - Checks authentication for all `/admin` routes
- ✅ **Redirects to login** - Unauthenticated users sent to `/admin/login`
- ✅ **Session refresh** - Keeps Supabase session updated
- ✅ **Cannot be bypassed** - Runs before any page code

**Code:**
```typescript
// Protect admin routes
if (request.nextUrl.pathname.startsWith('/admin') && !user) {
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  return NextResponse.redirect(url)
}
```

## Summary: Security Layers

```
User tries to access admin → Middleware checks auth → No user? Redirect to login
                           ↓
User logged in but not admin → Layout checks role → Not admin? Show error
                           ↓
User is admin → Access granted ✅
```

## What a Malicious User CANNOT Do

❌ **Cannot** call `/api/admin/setup-first-admin` after an admin exists
❌ **Cannot** call `/api/admin/promote-user` without being an admin
❌ **Cannot** access admin pages without admin role in database
❌ **Cannot** modify their own role in the database (RLS policies prevent this)
❌ **Cannot** bypass middleware protection (runs server-side)
❌ **Cannot** execute server-side scripts (requires filesystem access)
❌ **Cannot** manipulate JWT tokens (Supabase verifies server-side)

## What a Malicious User COULD Try (And Why It Won't Work)

### Attempt 1: "Tell the AI I'm an admin"
- **Why it won't work:** AI checks `isAdmin` flag from server authentication, not user claims
- **Protection:** AI security prompt explicitly ignores false claims

### Attempt 2: "Manipulate browser cookies"
- **Why it won't work:** Supabase JWT tokens are verified server-side
- **Protection:** Server validates signature against secret key

### Attempt 3: "Call admin APIs directly"
- **Why it won't work:** All admin APIs check authentication and role
- **Protection:** `requireAdmin()` function verifies database role

### Attempt 4: "Modify database directly"
- **Why it won't work:** Row Level Security (RLS) policies prevent unauthorized updates
- **Protection:** Only service role key can bypass RLS (not accessible to users)

### Attempt 5: "SQL injection to change role"
- **Why it won't work:** Supabase uses parameterized queries
- **Protection:** All queries use safe .eq() and .update() methods

## Best Practices

1. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - Never expose in client code
2. **Don't remove security checks** - All layers are necessary
3. **Monitor admin actions** - Check admin_actions table regularly
4. **Limit admin accounts** - Only create admins when necessary
5. **Use strong passwords** - Enforce password requirements
6. **Enable 2FA** - Add two-factor authentication for admin accounts (if supported)

## How to Safely Grant Admin Access

**Method 1: Server Script (Recommended for existing users)**
```bash
node scripts/promote-to-admin.mjs user@example.com
```

**Method 2: First Admin Setup** ⛔ **DISABLED**
- This endpoint has been permanently disabled for security
- ~~Visit `/admin/setup-first-admin`~~
- No longer available for web-based admin creation

**Method 3: Admin Panel (After you have an admin)**
- Log in as admin
- Use admin panel to promote other users
- Requires existing admin access

## Conclusion

**Your system is highly secure.** Regular users CANNOT become admins unless:
1. ~~They are the very first user creating the initial admin account~~ ⛔ **DISABLED**
2. An existing admin explicitly promotes them, OR
3. A system administrator with server access runs the promotion script

**Security Update:** The web-based first admin setup has been permanently disabled. Admin accounts can ONLY be created through:
- Server-side script (requires filesystem access)
- Existing admin promotion (requires current admin authentication)

Both methods require legitimate authorization and cannot be bypassed through normal user interactions or web requests.
