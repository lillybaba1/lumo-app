# Admin Role Management Guide

## Overview

This guide covers multiple methods to assign and manage admin roles in your Lumo e-commerce app with Supabase.

---

## Method 1: Direct SQL in Supabase Dashboard (Fastest)

### Steps:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Run one of these queries:

#### Promote User to Admin by Email
```sql
UPDATE user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';
```

#### Promote User to Admin by ID
```sql
UPDATE user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE id = 'user-uuid-here';
```

#### View All Admins
```sql
SELECT id, email, name, role, created_at 
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at;
```

#### Revoke Admin Access
```sql
UPDATE user_profiles 
SET role = 'user', updated_at = NOW()
WHERE email = 'admin@example.com';
```

---

## Method 2: Using the Admin Management Script

We've created a command-line script for easy admin management.

### Setup:
```bash
# Make sure you have environment variables set
# Add to .env.local:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Usage:

#### Promote a User to Admin
```bash
npx tsx scripts/make-admin.ts promote user@example.com
```

#### Revoke Admin Access
```bash
npx tsx scripts/make-admin.ts revoke admin@example.com
```

#### List All Admins
```bash
npx tsx scripts/make-admin.ts list
```

### Script Features:
- ✅ Validates user exists before promoting
- ✅ Shows current role before changes
- ✅ Prevents duplicate promotions
- ✅ Lists all admins with details
- ✅ User-friendly output with emojis

---

## Method 3: Using the API Endpoint

For programmatic access or building admin UI panels.

### Endpoint: `/api/admin/manage-role`

#### Promote User to Admin
```bash
curl -X POST https://your-domain.vercel.app/api/admin/manage-role \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "action": "promote"
  }'
```

#### Revoke Admin Access
```bash
curl -X POST https://your-domain.vercel.app/api/admin/manage-role \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "action": "revoke"
  }'
```

#### List All Admins
```bash
curl -X GET https://your-domain.vercel.app/api/admin/manage-role \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript/TypeScript Example:
```typescript
// Get access token from Supabase session
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Promote user
const response = await fetch('/api/admin/manage-role', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    action: 'promote'
  })
});

const result = await response.json();
console.log(result);
```

---

## Method 4: Create First Admin (Bootstrap)

If you don't have any admins yet, you'll need to create the first one manually.

### Option A: Direct Database Access
1. Register a regular user account through the signup form
2. Go to Supabase Dashboard → **Table Editor** → `user_profiles`
3. Find your user by email
4. Edit the row and change `role` from `user` to `admin`
5. Click Save

### Option B: SQL Query
```sql
-- Replace with your email
UPDATE user_profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'your-first-admin@example.com';
```

### Option C: Using Script (Requires Service Role Key)
```bash
npx tsx scripts/make-admin.ts promote your-first-admin@example.com
```

---

## Security Best Practices

### ✅ DO:
- Keep your `SUPABASE_SERVICE_ROLE_KEY` secret and never expose it to clients
- Use Row Level Security (RLS) policies to protect admin routes
- Log all admin role changes for audit trails
- Require strong passwords for admin accounts
- Use multi-factor authentication for admin accounts (if available)

### ❌ DON'T:
- Don't allow users to self-promote to admin
- Don't expose the service role key in client-side code
- Don't forget to verify current user is admin before allowing role changes
- Don't allow admins to revoke their own admin access (API prevents this)

---

## Row Level Security (RLS) Policies

Add these policies in Supabase to protect admin operations:

### View User Profiles (Admins Only)
```sql
CREATE POLICY "Admins can view all user profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
```

### Update User Roles (Admins Only)
```sql
CREATE POLICY "Admins can update user roles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
```

---

## Troubleshooting

### Issue: Script can't find user
**Solution:** Make sure the user has registered through the signup form first. The user must exist in both `auth.users` and `user_profiles` tables.

### Issue: "Unauthorized" error in API
**Solution:** Ensure you're passing a valid access token in the Authorization header. Get it from:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### Issue: Can't promote first admin
**Solution:** Use Method 1 (Direct SQL) or Method 4 (Bootstrap) to create your first admin.

### Issue: Table doesn't exist
**Solution:** Make sure you've created the `user_profiles` table in Supabase. See `MIGRATION_COMPLETE.md` for the SQL schema.

---

## Quick Reference

| Method | Use Case | Requires |
|--------|----------|----------|
| **SQL Dashboard** | Quick one-off changes | Supabase dashboard access |
| **CLI Script** | Development/maintenance | Service role key + terminal |
| **API Endpoint** | Admin UI panel | Existing admin account |
| **Bootstrap** | First admin setup | Database access |

---

## Common Commands

```bash
# Install dependencies (if needed)
npm install @supabase/supabase-js tsx

# Make someone admin
npx tsx scripts/make-admin.ts promote user@example.com

# Remove admin access
npx tsx scripts/make-admin.ts revoke user@example.com

# List all admins
npx tsx scripts/make-admin.ts list

# View help
npx tsx scripts/make-admin.ts
```

---

## Next Steps

1. **Create your first admin** using Method 1 or 4
2. **Test admin access** by logging in with the admin account
3. **Build admin UI** to manage users through the web interface
4. **Set up RLS policies** to secure admin operations
5. **Enable audit logging** for admin actions

---

**Need Help?**
- Check the Supabase documentation: https://supabase.com/docs
- Review the API route code: `src/app/api/admin/manage-role/route.ts`
- Inspect the script: `scripts/make-admin.ts`

---

*Last updated: December 2024*
