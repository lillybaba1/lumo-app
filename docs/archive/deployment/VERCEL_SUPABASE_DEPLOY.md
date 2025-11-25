# 🚀 Vercel Deployment Guide for Lumo App (Supabase Version)

## Prerequisites

1. ✅ Vercel account (free): https://vercel.com/signup
2. ✅ GitHub repository connected to Vercel
3. ✅ Supabase project set up: https://edsuvnlbviosnyxbjptx.supabase.co

## Step-by-Step Deployment

### Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 2: Environment Variables Setup

You need to configure these environment variables in Vercel:

#### **Required Environment Variables:**

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://edsuvnlbviosnyxbjptx.supabase.co` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Supabase Dashboard > Settings > API (⚠️ Keep secret!) |
| `OPENAI_API_KEY` | Your OpenAI key | OpenAI Dashboard |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `lumo-app-183f5.firebasestorage.app` | For images (if still using Firebase Storage) |
| `SERVICE_ACCOUNT_JSON` | Firebase service account | For Firebase Storage uploads |

#### **Optional but Recommended:**

| Variable Name | Value | Purpose |
|--------------|-------|---------|
| `SESSION_COOKIE_NAME` | `session` | Session management |
| `NODE_ENV` | `production` | Environment flag |

### Step 3: Add Environment Variables to Vercel

#### **Option A: Via Vercel Dashboard** (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your `lumo-app` project
3. Click **Settings** → **Environment Variables**
4. Add each variable:

**For Public Variables** (like `NEXT_PUBLIC_SUPABASE_URL`):
- Environment: ✅ Production, ✅ Preview, ✅ Development

**For Secret Variables** (like `SUPABASE_SERVICE_ROLE_KEY`):
- Environment: ✅ Production, ✅ Preview only
- ⚠️ DO NOT check Development (use `.env.local` locally)

5. Click **Save** for each variable

#### **Option B: Via Vercel CLI**

```bash
# Navigate to your project
cd /home/heilige/lumo-app

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# When prompted, paste: https://edsuvnlbviosnyxbjptx.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste your anon key from Supabase

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste your service role key from Supabase

vercel env add OPENAI_API_KEY production
# Paste your OpenAI API key
```

### Step 4: Update vercel.json for Supabase

Your current `vercel.json` still references Firebase. Let's update it:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "OPENAI_API_KEY": "@openai_api_key"
  }
}
```

### Step 5: Deploy to Vercel

#### **Option A: Automatic Deployment (Git Push)**

1. Commit your changes:
```bash
git add .
git commit -m "chore: prepare for Vercel deployment with Supabase"
git push origin master
```

2. Vercel will automatically detect the push and deploy
3. Check deployment progress at: https://vercel.com/dashboard

#### **Option B: Manual Deployment via CLI**

```bash
# From your project directory
cd /home/heilige/lumo-app

# Deploy to production
vercel --prod

# Or deploy to preview first (recommended)
vercel
```

### Step 6: Configure Supabase for Your Vercel Domain

After deployment, you'll get a Vercel URL like `your-app.vercel.app`. You need to add it to Supabase:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/edsuvnlbviosnyxbjptx
2. Click **Authentication** → **URL Configuration**
3. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**` (wildcard for all paths)

### Step 7: Verify Deployment

After deployment completes:

1. ✅ Visit your Vercel URL
2. ✅ Test signup flow
3. ✅ Test login flow
4. ✅ Check if products load
5. ✅ Verify image uploads work
6. ✅ Test AI assistant (if using OpenAI)

### Step 8: Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain (e.g., `lumo.shop`)
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs to include your custom domain

## 🔧 Build Configuration

Your app uses a custom build script. Ensure `scripts/run-build.mjs` is compatible with Vercel.

**Vercel Build Settings** (if needed):
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node.js Version: **18.x** or **20.x**

## 🐛 Troubleshooting

### Issue: Build Fails

**Check:**
- All dependencies are in `package.json`
- No TypeScript errors: Run `npm run build` locally first
- Environment variables are set correctly

**Solution:**
```bash
# Test build locally
npm run build

# If successful, commit and push
git add .
git commit -m "fix: resolve build issues"
git push
```

### Issue: "Supabase client not configured"

**Solution:**
- Verify environment variables are set in Vercel
- Redeploy: Deployments → ⋯ Menu → Redeploy

### Issue: Authentication not working

**Solution:**
- Check Supabase redirect URLs include your Vercel domain
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check browser console for errors

### Issue: Images not uploading

**Solution:**
- Verify Firebase Storage credentials are set (if using Firebase for storage)
- Or migrate to Supabase Storage and update storage service
- Check API route `/api/upload` has proper environment variables

### Issue: Database queries fail

**Solution:**
- ⚠️ **CRITICAL**: Fix RLS recursion issue in Supabase (see `fix-rls-recursion.sql`)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase logs for errors

## 📊 Performance Optimization

### Enable Edge Functions (Optional)

For faster global performance:

```json
// In your API routes
export const runtime = 'edge';
export const preferredRegion = 'iad1'; // Or your nearest region
```

### Enable ISR (Incremental Static Regeneration)

For product pages:

```typescript
// In product page
export const revalidate = 3600; // Revalidate every hour
```

## 🔐 Security Checklist

- ✅ `SUPABASE_SERVICE_ROLE_KEY` is set as **secret** (not exposed to client)
- ✅ API keys are not committed to git
- ✅ RLS policies are enabled in Supabase
- ✅ HTTPS is enforced (Vercel does this automatically)
- ✅ CORS is configured properly

## 📱 Post-Deployment

### Monitor Your App

1. **Vercel Analytics**: Enable in Dashboard → Analytics
2. **Vercel Logs**: Dashboard → Your Project → Deployments → View Function Logs
3. **Supabase Logs**: Supabase Dashboard → Logs & Monitoring

### Set Up Monitoring

```bash
# Install Vercel CLI for logs
npm install -g vercel

# View logs
vercel logs
```

## 🚀 Quick Deploy Commands

```bash
# Pull latest environment variables
vercel env pull .env.local

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs --follow
```

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Your Vercel Dashboard: https://vercel.com/dashboard

## ✅ Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase RLS policies fixed (run `fix-rls-recursion.sql`)
- [ ] Supabase redirect URLs updated with Vercel domain
- [ ] Build succeeds locally (`npm run build`)
- [ ] Code committed and pushed to GitHub
- [ ] Deployment triggered (automatic or manual)
- [ ] Signup/Login tested on production
- [ ] Products loading correctly
- [ ] Image uploads working
- [ ] AI assistant functional (if applicable)
- [ ] Custom domain configured (optional)

---

**Your Vercel URL will be**: `https://lumo-app-[random].vercel.app` or your custom domain.

Good luck with your deployment! 🎉
