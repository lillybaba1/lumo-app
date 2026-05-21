# Marketplace Migration - Quick Start

## ⚡ Quick 2-Step Migration Process

### Step 1: Run SQL Schema Migration (5 minutes)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Open `migrations/001_marketplace_schema.sql` in your code editor
6. Copy **ALL** contents (Ctrl+A, Ctrl+C)
7. Paste into Supabase SQL Editor (Ctrl+V)
8. Click **Run** button (or Ctrl+Enter)
9. Wait for "Success. No rows returned" message

### Step 2: Run Data Migration (1 minute)

Open terminal in your project directory and run:

```bash
npm run migrate:marketplace
```

You should see:
```
✅ Found admin user: your-email@example.com
✅ Created default business account
✅ Updated admin user
✅ Updated X products with default seller_id
✅ Migrated user roles
✅ Marketplace migration completed successfully!
```

## ✅ Verification

After both steps complete:

1. **Check Business Dashboard**: http://localhost:3000/business/dashboard
   - Should load without errors
   - Shows your business stats

2. **Check Sign-Up**: http://localhost:3000/signup
   - Should show account type selection
   - Two options: Personal Account / Business Account

3. **Check Admin**: http://localhost:3000/admin/dashboard
   - Still works as before
   - Can see all products

## 🚨 Troubleshooting

### "Table 'business_accounts' not found"
→ Step 1 (SQL migration) not completed. Run it in Supabase Dashboard.

### "No admin user found"
→ Create admin first: `npm run create:admin`

### SQL migration shows errors
→ Check if tables already exist. Migration is safe to re-run.

## 📚 Need More Details?

See full guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

## 🎯 Current Status

Based on your last run:
- ✅ Admin user found: heiligegeist01@gmail.com
- ⏳ Waiting for SQL schema migration (Step 1)
- ⏳ Then run: `npm run migrate:marketplace` (Step 2)
