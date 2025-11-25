# 🚀 Lumo App Deployment Guide

Complete guide to deploying Lumo App to production on Vercel.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Deployment Methods](#deployment-methods)
- [Post-Deployment Setup](#post-deployment-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ **GitHub Account** with repository: `lillybaba1/lumo-app`
- ✅ **Vercel Account** (free): [Sign up here](https://vercel.com/signup)
- ✅ **Supabase Project**: `https://edsuvnlbviosnyxbjptx.supabase.co`
- ✅ **Google AI API Key**: [Get it here](https://aistudio.google.com/app/apikey)
- ✅ **Firebase Project** (for legacy features): `lumo-app-183f5`

---

## Quick Start

### Method 1: One-Click Deploy (Fastest ⚡)

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flillybaba1%2Flumo-app&project-name=lumo-app&repo-name=lumo-app)

**Steps:**
1. Sign in to Vercel
2. Click "Create" to import the repository
3. Add environment variables (see below)
4. Click "Deploy" and wait 2-3 minutes

### Method 2: Command Line Deploy

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Navigate to project
cd /home/heilige/lumo-app

# 4. Deploy
vercel --prod
```

---

## Environment Variables

### Required Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

#### Supabase (Required)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://edsuvnlbviosnyxbjptx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Where to get:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/edsuvnlbviosnyxbjptx)
2. Settings → API
3. Copy the keys

#### Google AI (Required for AI Assistant)
```bash
GOOGLE_API_KEY=<your-google-ai-key>
```

**Where to get:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Copy the key

#### Firebase (Required for some features)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumo-app-183f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumo-app-183f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=599053873389
NEXT_PUBLIC_FIREBASE_APP_ID=1:599053873389:web:7ae9fc52e26be1e3d89ce4
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
FIREBASE_COOKIE_NAME=session
FIREBASE_SERVICE_ACCOUNT_JSON=<your-firebase-admin-json>
```

**Where to get Firebase Admin JSON:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lumo-app-183f5`
3. Settings ⚙️ → Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download JSON file
6. Copy entire contents as single line

### Optional Variables
```bash
NODE_ENV=production
SESSION_COOKIE_NAME=session
```

---

## Deployment Methods

### Via Vercel Dashboard

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import `lillybaba1/lumo-app` from GitHub

2. **Configure Project:**
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: (leave default)
   - Output Directory: (leave default)

3. **Add Environment Variables:**
   - Go to Settings → Environment Variables
   - Add all required variables from above
   - Environment: Check Production, Preview

4. **Deploy:**
   - Go to Deployments tab
   - Click "Deploy" or it will auto-deploy on push

### Via Vercel CLI

```bash
# Link project (first time only)
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GOOGLE_API_KEY production
# ... add all other variables

# Deploy to production
vercel --prod
```

---

## Post-Deployment Setup

### 1. Update Supabase Redirect URLs

Go to Supabase Dashboard → Authentication → URL Configuration

Add your Vercel URLs:
```
Site URL: https://your-app.vercel.app
Redirect URLs:
  - https://your-app.vercel.app/auth/callback
  - https://your-app.vercel.app/**
```

### 2. Create Admin Account

Visit: `https://your-app.vercel.app/admin/setup-first-admin`

1. Enter admin credentials
2. Submit form
3. Login at `/admin/login`

### 3. Test Your Deployment

Check these features:
- ✅ Homepage loads
- ✅ Products display correctly
- ✅ AI Assistant responds
- ✅ User signup/login works
- ✅ Admin panel accessible
- ✅ Image uploads work
- ✅ Email verification works

---

## Troubleshooting

### Build Fails

**Check:**
- All environment variables are set in Vercel
- No TypeScript errors: Run `npm run build` locally first
- Dependencies are up to date

**Fix:**
```bash
# Test build locally
npm run build

# Check for errors
npm run lint
```

### AI Assistant Not Working

**Check:**
- `GOOGLE_API_KEY` is set in Vercel environment variables
- API key is valid at [Google AI Studio](https://aistudio.google.com/)

**Fix:**
1. Regenerate API key
2. Update in Vercel
3. Redeploy

### Database/Auth Errors

**Check:**
- Supabase keys are correct
- Supabase redirect URLs include your Vercel domain
- Service role key is set (not just anon key)

**Fix:**
1. Verify all three Supabase environment variables
2. Check Supabase Dashboard → Authentication → URL Configuration
3. Redeploy after fixing

### Image Upload Fails

**Check:**
- Using Supabase Storage (current) or Firebase Storage (legacy)
- Correct storage credentials are set
- Storage bucket exists and has proper permissions

**Fix for Supabase Storage:**
1. Go to Supabase Dashboard → Storage
2. Check `product-images` bucket exists
3. Verify bucket is public or has proper RLS policies

**Fix for Firebase Storage:**
1. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set
2. Ensure it's valid JSON (entire file contents)
3. Check Firebase Storage rules allow uploads

### Email Verification Not Working

**Check:**
- Supabase email templates are configured
- SMTP settings in Supabase Dashboard
- Email provider settings

**Fix:**
1. Supabase Dashboard → Authentication → Email Templates
2. Customize "Confirm signup" template
3. Test email delivery

---

## Monitoring & Maintenance

### View Logs
```bash
# Via CLI
vercel logs --follow

# Via Dashboard
Vercel Dashboard → Your Project → Deployments → View Logs
```

### Analytics
- **Vercel Analytics:** Automatic (enable in dashboard)
- **Supabase Dashboard:** Monitor database usage
- **Firebase Console:** Monitor storage and auth

### Costs
- **Vercel:** FREE (Hobby plan)
- **Supabase:** FREE tier (generous limits)
- **Google AI API:** FREE tier + pay-as-you-go
- **Firebase:** FREE tier (Spark plan)

---

## Additional Resources

- **Supabase Migration Status:** See `SUPABASE_MIGRATION_STATUS.md`
- **Authentication System:** See `AUTH_SYSTEM_IMPLEMENTATION.md`
- **Theme System:** See `THEME_SYSTEM.md`
- **Admin Features:** See `ADMIN_FEATURES.md`
- **Security Checklist:** See `SECURITY_CHECKLIST.md`

---

## Support

- **GitHub Issues:** https://github.com/lillybaba1/lumo-app/issues
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Estimated deployment time:** 2-5 minutes

**Last updated:** 2025-11-25
