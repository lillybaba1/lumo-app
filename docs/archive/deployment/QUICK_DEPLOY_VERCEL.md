# 🚀 Quick Vercel Deployment Guide

## Fast Track Deployment (3 Steps)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Set Up Environment Variables
```bash
./setup-vercel-env.sh
```

**Or manually via Vercel Dashboard:**
Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Add these variables:**

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://edsuvnlbviosnyxbjptx.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Get from Supabase Dashboard | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Get from Supabase Dashboard | Secret |
| `OPENAI_API_KEY` | Your OpenAI key | Secret |

### Step 3: Deploy
```bash
./deploy-vercel.sh
```

**Or manually:**
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

---

## 📍 Where to Get Your Keys

### Supabase Keys
1. Go to: https://supabase.com/dashboard/project/edsuvnlbviosnyxbjptx
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

### OpenAI Key
1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy to `OPENAI_API_KEY`

---

## ⚠️ Before Deploying

### Critical: Fix Supabase RLS Issue
```bash
# Run this SQL in Supabase Dashboard → SQL Editor
cat fix-rls-recursion.sql
```
This fixes the infinite recursion error!

### Test Build Locally
```bash
npm run build
```
If this fails, fix errors before deploying.

---

## 🎯 After Deployment

### 1. Update Supabase Redirect URLs
Go to Supabase Dashboard → Authentication → URL Configuration

Add your Vercel URL:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: 
  - `https://your-app.vercel.app/auth/callback`
  - `https://your-app.vercel.app/**`

### 2. Test Your App
- [ ] Visit your Vercel URL
- [ ] Test signup/login
- [ ] Check if products load
- [ ] Verify images work
- [ ] Test AI assistant

---

## 🆘 Quick Troubleshooting

**Build fails?**
```bash
npm run build  # Test locally first
```

**Auth not working?**
- Check Supabase redirect URLs
- Verify environment variables in Vercel

**Database errors?**
- Run `fix-rls-recursion.sql` in Supabase
- Check service role key is set

**Images not uploading?**
- Verify Firebase Storage credentials (if using)
- Or migrate to Supabase Storage

---

## 📱 Deployment Commands

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Pull env variables
vercel env pull .env.local
```

---

## 🔗 Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/edsuvnlbviosnyxbjptx
- **Your GitHub**: https://github.com/lillybaba1/lumo-app
- **Full Guide**: See `VERCEL_SUPABASE_DEPLOY.md`

---

## ✅ Deployment Checklist

- [ ] Vercel CLI installed
- [ ] Environment variables set
- [ ] Supabase RLS fixed
- [ ] Build succeeds locally
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Supabase redirect URLs updated
- [ ] Signup/Login tested
- [ ] Products loading
- [ ] Images working

---

**Need detailed instructions?** Read `VERCEL_SUPABASE_DEPLOY.md`

**Ready to deploy?** Run: `./deploy-vercel.sh`

Good luck! 🎉
