# Marketplace Migration Guide

This guide will help you migrate your Lumo application from a single-admin store to a multi-seller marketplace.

## Overview

The migration consists of two main steps:
1. **SQL Schema Migration** - Updates database structure (tables, columns, indexes)
2. **Data Migration** - Backfills existing data and migrates roles

## Prerequisites

- Access to your Supabase Dashboard
- Admin user account in your database
- Backup of your database (recommended)

## Step 1: Run SQL Schema Migration

The SQL schema migration adds new tables and columns required for the marketplace features.

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `migrations/001_marketplace_schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify all statements executed successfully

### Option B: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push migrations/001_marketplace_schema.sql
```

### What this migration does:

- ✅ Creates `business_accounts` table
- ✅ Adds `business_account_id` column to `user_profiles` table
- ✅ Adds `seller_id` column to `products` table
- ✅ Adds `customer_id` column to `orders` table
- ✅ Creates indexes for performance

## Step 2: Run Data Migration

After the SQL schema migration succeeds, run the data migration to backfill existing data.

### Command:

```bash
npm run migrate:marketplace
```

### What this migration does:

1. **Creates Default Business Account**
   - Finds your first admin user
   - Creates a "Lumo Store" business account owned by that admin
   - Status: ACTIVE

2. **Backfills Products**
   - Updates all existing products to reference the default business account
   - Sets `seller_id` for all products without one

3. **Migrates User Roles**
   - `admin` → `APP_OWNER_ADMIN`
   - `customer` → `PERSONAL_ACCOUNT`
   - `user` → `PERSONAL_ACCOUNT`

4. **Links Admin User**
   - Updates admin user to reference their business account

### Expected Output:

```
🚀 Starting Marketplace Data Migration...

Step 1: Finding first admin user...
✅ Found admin user: admin@example.com (xxx-xxx-xxx)

Step 2: Checking for existing default business account...
Step 2b: Creating default "App Owner Seller" business account...
✅ Created default business account: xxx-xxx-xxx

Step 3: Updating admin user with business_account_id...
✅ Updated admin user

Step 4: Backfilling products with seller_id...
Found 10 products without seller_id
✅ Updated 10 products with default seller_id

Step 5: Migrating user roles to new system...
✅ Migrated user roles

📊 Migration Summary:
-------------------
Business Accounts: 1
Products with default seller: 10
APP_OWNER_ADMIN users: 1
BUSINESS_ACCOUNT users: 0
PERSONAL_ACCOUNT users: 5

✅ Marketplace migration completed successfully!
```

## Step 3: Verify Migration

After both migrations complete successfully:

### 1. Check Database Tables

In Supabase Dashboard → Table Editor:

- ✅ `business_accounts` table exists
- ✅ `user_profiles` has `business_account_id` column
- ✅ `products` has `seller_id` column
- ✅ `orders` has `customer_id` column

### 2. Check Data

- ✅ All products have a `seller_id`
- ✅ Admin user has a `business_account_id`
- ✅ User roles are updated to new values

### 3. Test Application Features

1. **Admin Dashboard** - `/admin/dashboard`
   - Should still work with `APP_OWNER_ADMIN` role
   - Can see all products from all sellers

2. **Business Dashboard** - `/business/dashboard`
   - Admin can access (has business account)
   - Shows only products owned by that seller
   - Displays business stats

3. **Sign-Up Flow** - `/signup`
   - Shows account type selection
   - Personal Account option works
   - Business Account option collects business info

4. **Product Creation** - `/admin/products/add`
   - Products automatically get `seller_id`
   - Business sellers can only see/edit their own products

## Troubleshooting

### Error: "No admin user found"

**Solution:** Create an admin user first:
```bash
npm run create:admin
```

### Error: "Failed to create business account"

**Possible causes:**
- SQL migration not run yet
- `business_accounts` table doesn't exist
- Database permissions issue

**Solution:** Run SQL migration first (Step 1)

### Error: "Failed to update products"

**Possible causes:**
- No products in database
- SQL migration not run yet
- `seller_id` column doesn't exist

**Solution:** Verify SQL migration completed successfully

### Products still showing `seller_id: null`

**Solution:**
- Re-run data migration: `npm run migrate:marketplace`
- Check Supabase logs for errors

### Business dashboard shows "Unauthorized"

**Possible causes:**
- Admin user doesn't have `business_account_id`
- Business account doesn't exist
- User role not updated to `APP_OWNER_ADMIN`

**Solution:**
- Check `user_profiles` table for admin user
- Verify `business_account_id` is set
- Verify `role` is `APP_OWNER_ADMIN`

## Rollback (Emergency Only)

If you need to rollback the migration:

### 1. Remove Added Columns

```sql
ALTER TABLE user_profiles DROP COLUMN IF EXISTS business_account_id;
ALTER TABLE products DROP COLUMN IF EXISTS seller_id;
ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;
```

### 2. Drop New Table

```sql
DROP TABLE IF EXISTS business_accounts CASCADE;
```

### 3. Restore User Roles

```sql
UPDATE user_profiles SET role = 'admin' WHERE role = 'APP_OWNER_ADMIN';
UPDATE user_profiles SET role = 'customer' WHERE role = 'PERSONAL_ACCOUNT';
```

⚠️ **Warning:** This will delete all business accounts and seller data!

## Post-Migration Checklist

- [ ] SQL schema migration completed successfully
- [ ] Data migration completed successfully
- [ ] All products have `seller_id`
- [ ] Admin user has `business_account_id`
- [ ] User roles migrated correctly
- [ ] Admin dashboard accessible
- [ ] Business dashboard accessible
- [ ] Sign-up flow works for both account types
- [ ] Product creation assigns correct `seller_id`
- [ ] Business users can only see their own products
- [ ] Code deployed to production

## Support

If you encounter issues not covered in this guide:

1. Check Supabase logs: Dashboard → Logs
2. Check application logs: `npm run dev` console output
3. Review migration SQL file: `migrations/001_marketplace_schema.sql`
4. Review data migration script: `scripts/migrate-marketplace.mjs`

## Next Steps

After successful migration:

1. **Test All Features** - Thoroughly test all marketplace functionality
2. **Invite Beta Sellers** - Invite trusted users to create business accounts
3. **Monitor Performance** - Watch for any issues with the new data structure
4. **Update Documentation** - Update user guides with new marketplace features
5. **Configure Business Policies** - Set up approval workflows for new sellers
