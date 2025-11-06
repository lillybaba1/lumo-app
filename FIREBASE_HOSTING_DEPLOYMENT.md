# Firebase Hosting Deployment Guide

## Problem Solved
Your `.env.local` file has been created with Firebase credentials for local development. For production deployment on Firebase Hosting, you need to configure environment variables using Firebase's environment configuration.

---

## ✅ Local Development Setup (Completed)

Your `.env.local` file is now configured with:
- Firebase Admin Service Account credentials
- Google AI API Key
- All Firebase client configuration

**To start local development:**
```bash
npm run dev
```

**Verify your local setup:**
```bash
node scripts/verify-firebase-env.js
```

---

## 🚀 Firebase Hosting Production Deployment

Firebase Hosting with Next.js uses the Web Frameworks feature, which handles both static files and serverless functions.

### Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Set Production Environment Variables

Firebase Hosting with Next.js supports environment variables through the `.env` file or Firebase environment config. Since your app uses Next.js with Firebase Hosting, the environment variables in your Next.js app will be automatically bundled during build.

**Option A: Use .env.production (Recommended)**

A `.env.production` file has already been created for you with all the credentials from the service account JSON you provided.

**To verify or update it:**

1. The file is located at `.env.production` in your project root
2. It contains the same credentials as `.env.local`
3. It will be used automatically during Firebase deployment

**Important:** The `.env.production` file is excluded from git for security (via `.gitignore`).

If you need to recreate it, use this template:

```bash
# ============================================
# Google AI API Key (Copy from your .env.local file)
# ============================================
GOOGLE_API_KEY=<COPY_FROM_YOUR_ENV_LOCAL_FILE>

# ============================================
# Firebase Client Configuration (Public)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumo-app-183f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumo-app-183f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=599053873389
NEXT_PUBLIC_FIREBASE_APP_ID=1:599053873389:web:7ae9fc52e26be1e3d89ce4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-EHRCCLS6CV

# ============================================
# Firebase Server Configuration
# ============================================
FIREBASE_COOKIE_NAME=session
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app

# Firebase Admin SDK Service Account (Copy from your .env.local file)
# IMPORTANT: Use the actual service account JSON from your Firebase console
# The credentials are already in your .env.local file - copy from there
FIREBASE_SERVICE_ACCOUNT_JSON=<COPY_FROM_YOUR_ENV_LOCAL_FILE>

# ============================================
# Node Environment
# ============================================
NODE_ENV=production
```

**⚠️ IMPORTANT:** Add `.env.production` to your `.gitignore` (it should already be there as `.env*`)

**Option B: Use Firebase Secrets (More Secure)**

For sensitive credentials like the service account, use Firebase secrets:

```bash
# Set the service account as a secret
firebase functions:secrets:set FIREBASE_SERVICE_ACCOUNT_JSON
# Paste the JSON when prompted

# Set other secrets
firebase functions:secrets:set GOOGLE_API_KEY
```

Then update your code to read from `process.env.FIREBASE_SERVICE_ACCOUNT_JSON`.

### Step 4: Deploy to Firebase Hosting

```bash
# Build and deploy
firebase deploy --only hosting
```

Or deploy everything (hosting + firestore rules + storage rules):

```bash
firebase deploy
```

### Step 5: Verify Deployment

After deployment, test these features:

1. **Visit your app:** `https://lumo-app-183f5.web.app`
2. **Test sign up:** Create a new account at `/signup`
3. **Test login:** Sign in at `/login`
4. **Test protected routes:** Access admin panel
5. **Test AI assistant:** Try the AI chat feature
6. **Test image uploads:** Upload product images

---

## 🔐 Security Best Practices

### Files to NEVER commit to git:

Your `.gitignore` already excludes these (verify):
```
.env*
service-account*.json
firebase-debug.log
.firebase/
```

### Verify .gitignore:

```bash
cat .gitignore | grep -E '\.env|service-account'
```

---

## 📋 Deployment Checklist

Before deploying:

```
✅ .env.local created for local development
✅ .env.production created (or secrets configured)
✅ .gitignore excludes .env* files
✅ Firebase CLI installed (firebase-tools)
✅ Logged in to Firebase (firebase login)
✅ Project initialized (firebase.json exists)
✅ All dependencies installed (npm install)
```

Deploy:

```
✅ Run: firebase deploy --only hosting
✅ Wait for deployment to complete
✅ Test authentication on live site
✅ Test all critical features
```

---

## 🛠️ Common Commands

```bash
# Local development
npm run dev

# Build production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy everything (hosting + rules)
firebase deploy

# View deployment logs
firebase hosting:channel:list

# Open Firebase console
firebase open hosting
```

---

## 🐛 Troubleshooting

### Issue: Authentication not working after deployment

**Solution 1: Check environment variables**
- Ensure `.env.production` exists with all credentials
- Or ensure Firebase secrets are set correctly

**Solution 2: Check Firebase console**
- Go to https://console.firebase.google.com/project/lumo-app-183f5
- Check Authentication → Sign-in methods
- Ensure Email/Password is enabled

**Solution 3: Check deployment logs**
```bash
firebase hosting:channel:list
firebase functions:log
```

### Issue: "Invalid service account" error

**Cause:** The `FIREBASE_SERVICE_ACCOUNT_JSON` is not being loaded in production

**Solution:**
- Make sure `.env.production` is present during build
- Or use Firebase secrets instead
- Verify the JSON is properly formatted (single line, no line breaks except `\n`)

### Issue: Images not uploading

**Solution:**
- Check Firebase Storage rules in `storage.rules`
- Ensure `FIREBASE_STORAGE_BUCKET` is set correctly
- Verify service account has Storage Admin permissions

---

## 📊 Monitoring

After deployment, monitor your app:

1. **Firebase Console:** https://console.firebase.google.com/project/lumo-app-183f5
2. **Hosting Metrics:** Check traffic and performance
3. **Authentication:** Monitor sign-ups and logins
4. **Firestore:** Check database usage
5. **Storage:** Monitor file uploads

---

## 🚀 Quick Deploy Script

Create a deployment script `deploy.sh`:

```bash
#!/bin/bash

echo "🔍 Checking environment..."
node scripts/verify-firebase-env.js

echo ""
echo "📦 Building application..."
npm run build

echo ""
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo "🌐 Visit: https://lumo-app-183f5.web.app"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run it:
```bash
./deploy.sh
```

---

## Summary

**Local Development:**
- ✅ `.env.local` is configured
- ✅ Run `npm run dev` to start
- ✅ All Firebase features work locally

**Production Deployment:**
- ✅ Create `.env.production` with credentials
- ✅ Run `firebase deploy --only hosting`
- ✅ Test on `https://lumo-app-183f5.web.app`

**Your Firebase Admin credentials are now properly configured for both local and production environments!** 🎉
