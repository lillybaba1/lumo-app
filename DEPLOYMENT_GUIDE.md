# Vercel Deployment Guide for Lumo App

## Quick Deploy to Vercel

### Prerequisites
- GitHub account with this repository
- Vercel account (sign up at https://vercel.com)
- Firebase project credentials
- Google AI API key

---

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Connect Repository

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select **lillybaba1/lumo-app**
4. Click **Import**

### Step 2: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** ./

**Build Command:** `npm run build`

**Output Directory:** `.next` (auto-detected)

**Install Command:** `npm install`

### Step 3: Add Environment Variables

Click **Environment Variables** and add ALL of the following:

#### Firebase Client Configuration (Public - Required)

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumo-app-183f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumo-app-183f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=599053873389
NEXT_PUBLIC_FIREBASE_APP_ID=1:599053873389:web:7ae9fc52e26be1e3d89ce4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-EHRCCLS6CV
```

#### Server Configuration (Required)

```
FIREBASE_COOKIE_NAME=session
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
```

#### Google AI (Required for AI Assistant)

```
GOOGLE_API_KEY=<your-google-ai-api-key>
```

Get your Google AI API key from: https://aistudio.google.com/app/apikey

#### Firebase Admin SDK (Required for Admin Features)

```
FIREBASE_SERVICE_ACCOUNT_JSON=<your-firebase-service-account-json>
```

**How to get Firebase Service Account JSON:**
1. Go to https://console.firebase.google.com/
2. Select project: **lumo-app-183f5**
3. Click ⚙️ Settings → Project settings
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Copy the ENTIRE JSON content as a single line string
8. Paste into Vercel environment variable

**Important:** Make sure to copy the entire JSON including the outer `{}`

### Step 4: Deploy

1. Click **Deploy**
2. Wait for deployment to complete (2-3 minutes)
3. Visit your deployment URL

---

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### Step 3: Deploy

```bash
# From the project root directory
cd /home/user/lumo-app

# Deploy to Vercel
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No (or Yes if you already created one)
- **Project name?** lumo-app
- **Directory?** ./
- **Override settings?** No

### Step 4: Set Environment Variables via CLI

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# Enter: AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
# Enter: lumo-app-183f5.firebaseapp.com

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
# Enter: lumo-app-183f5

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
# Enter: lumo-app-183f5.firebasestorage.app

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
# Enter: 599053873389

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
# Enter: 1:599053873389:web:7ae9fc52e26be1e3d89ce4

vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production
# Enter: G-EHRCCLS6CV

vercel env add FIREBASE_COOKIE_NAME production
# Enter: session

vercel env add FIREBASE_STORAGE_BUCKET production
# Enter: lumo-app-183f5.firebasestorage.app

vercel env add GOOGLE_API_KEY production
# Enter: <your-google-ai-api-key>

vercel env add FIREBASE_SERVICE_ACCOUNT_JSON production
# Enter: <your-firebase-service-account-json>
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Option 3: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flillybaba1%2Flumo-app&env=NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,GOOGLE_API_KEY,FIREBASE_SERVICE_ACCOUNT_JSON,FIREBASE_COOKIE_NAME,FIREBASE_STORAGE_BUCKET)

Click the button above, then add all environment variables when prompted.

---

## Post-Deployment Steps

### 1. Verify Deployment

Visit your deployment URL and check:
- ✅ Homepage loads correctly
- ✅ Products display
- ✅ AI Assistant widget appears
- ✅ Login/signup works

### 2. Test Admin Features

1. Navigate to `/admin/setup-first-admin`
2. Create your admin account
3. Test file upload in product management
4. Test order management

### 3. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 4. Monitor Deployment

- Check deployment logs: https://vercel.com/dashboard
- Monitor Firebase usage: https://console.firebase.google.com/
- Monitor AI API usage: https://aistudio.google.com/

---

## Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | Yes | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | Yes | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | Yes | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Public | No | Firebase measurement ID |
| `GOOGLE_API_KEY` | Secret | Yes | Google AI (Gemini) API key |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Secret | Yes | Firebase Admin SDK credentials |
| `FIREBASE_COOKIE_NAME` | Secret | No | Session cookie name (default: session) |
| `FIREBASE_STORAGE_BUCKET` | Secret | Yes | Storage bucket for server |

---

## Troubleshooting

### Build Fails

**Error:** "Module not found"
- **Solution:** Run `npm install` locally to verify dependencies
- Check if all imports are correct

**Error:** "Type errors"
- **Solution:** Run `npm run build` locally to check for TypeScript errors

### Environment Variables Not Working

**Error:** "Firebase not initialized"
- **Solution:** Verify all `NEXT_PUBLIC_*` variables are set
- Redeploy after adding variables

**Error:** "Admin features not working"
- **Solution:** Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set correctly
- Ensure it's valid JSON (use a JSON validator)

### AI Assistant Not Working

**Error:** "AI not responding"
- **Solution:** Check `GOOGLE_API_KEY` is set
- Verify API key is valid at https://aistudio.google.com/

### Rate Limiting Issues

**Error:** "Too many requests"
- **Solution:** This is expected - rate limiting is working
- Wait 60 seconds and try again
- Increase limits in `src/lib/rate-limiter.ts` if needed

---

## Security Checklist

Before deploying to production:

- [ ] All environment variables are set in Vercel
- [ ] Firebase Security Rules are configured
- [ ] Google AI API key has appropriate restrictions
- [ ] Admin account is created with strong password
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] CORS is properly configured
- [ ] Rate limiting is active

---

## Performance Tips

1. **Enable Edge Caching**
   - Vercel automatically caches static assets
   - Theme is cached for 1 hour

2. **Monitor Bundle Size**
   - Check build output for large bundles
   - Use Vercel Analytics for insights

3. **Database Optimization**
   - Use Firebase indexes for frequently queried fields
   - Monitor Firestore usage

4. **AI Cost Management**
   - Rate limiting is already configured (20 req/min)
   - Monitor usage at https://aistudio.google.com/

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Project Issues:** https://github.com/lillybaba1/lumo-app/issues

---

## Quick Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel list

# Remove deployment
vercel remove <deployment-url>

# Pull environment variables
vercel env pull .env.local

# Add environment variable
vercel env add <key> <environment>
```

---

**Last Updated:** 2025-11-02
**Deployment Time:** ~3-5 minutes
**Status:** ✅ Ready for deployment
