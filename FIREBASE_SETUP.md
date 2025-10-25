# Firebase Setup Guide - Fix Signup Error

## ❌ Current Error
```
"Unable to detect a project Id in the current environment"
```

This means Firebase Admin SDK credentials are missing.

---

## ✅ Quick Fix - Get Firebase Service Account

### Step 1: Go to Firebase Console

1. Visit: https://console.firebase.google.com/
2. Select your project: **lumo-app-183f5**

### Step 2: Get Service Account Key

1. Click the **⚙️ (gear icon)** next to "Project Overview"
2. Click **"Project settings"**
3. Go to **"Service accounts"** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** in the popup
6. A JSON file will download (keep it safe!)

### Step 3: Add to Environment Variables

#### For Local Development:

**Option A: Add to `.env.local` (Recommended)**

1. Open or create `.env.local` in your project root
2. Copy the ENTIRE contents of the downloaded JSON file
3. Add this line (replace with your actual JSON):

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"lumo-app-183f5","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...your key here...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@lumo-app-183f5.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40lumo-app-183f5.iam.gserviceaccount.com","universe_domain":"googleapis.com"}'
```

**Important:**
- Keep the entire JSON in single quotes `'...'`
- Make sure newlines in private_key are `\n` (not actual newlines)
- No spaces between key and value

**Option B: Use file path (Alternative)**

1. Save the downloaded JSON file as `serviceAccountKey.json` in your project root
2. Add to `.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

⚠️ **Important:** Add `serviceAccountKey.json` to `.gitignore` so it's not committed!

#### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** Paste the entire JSON content (as one line)
   - **Environment:** Check all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your app

---

## 🔄 Restart Your App

After adding credentials:

### Local Development:
```bash
# Stop your dev server (Ctrl+C)
# Restart it
npm run dev
```

### Production:
Redeploy on Vercel (it will pick up the new environment variable)

---

## ✅ Test Signup

1. Go to `/signup`
2. Enter email and password
3. Click "Sign Up"
4. Should work now! ✨

---

## 📋 Complete .env.local Example

Your `.env.local` should look like this:

```bash
# Google AI API Key
GOOGLE_API_KEY=AIzaSyC_your_actual_key_here

# Firebase Admin Service Account (REQUIRED for signup/authentication)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"lumo-app-183f5","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@lumo-app-183f5.iam.gserviceaccount.com","client_id":"123456","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40lumo-app-183f5.iam.gserviceaccount.com"}'

# Optional
FIREBASE_COOKIE_NAME=session
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Still getting the error?

**Check 1: Is the JSON valid?**
- Make sure there are no extra spaces
- Private key should have `\n` for newlines
- Entire JSON wrapped in single quotes

**Check 2: Restart the server**
```bash
# Kill all Node processes
# Restart dev server
npm run dev
```

**Check 3: Check the console**
Look for these errors:
- ❌ "FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON" → Fix JSON format
- ❌ "Bad service account JSON" → Missing required fields
- ✅ No errors → Credentials loaded successfully!

**Check 4: Verify .env.local location**
Make sure `.env.local` is in your **project root** (same folder as `package.json`)

---

## 🔒 Security Notes

⚠️ **NEVER commit these files:**
- `.env.local`
- `serviceAccountKey.json`
- Any file with Firebase credentials

✅ **Good practices:**
- Keep service account JSON secure
- Only share with trusted team members
- Use environment variables in production
- Rotate keys if accidentally exposed

---

## 🎯 What This Fixes

Once configured, these features will work:
- ✅ User signup
- ✅ User login
- ✅ Authentication
- ✅ Protected routes
- ✅ Admin panel access
- ✅ Server-side Firebase operations
- ✅ Database operations
- ✅ Image uploads

---

## Alternative: Use Firebase Emulators (Development Only)

If you want to test without production credentials:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Start emulators
npm run emulator:start
```

Then update `.env.local`:
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

---

## Need Help?

**Firebase Console:** https://console.firebase.google.com/project/lumo-app-183f5

**Your Project ID:** `lumo-app-183f5`

**Service Account Location:**
Firebase Console → Project Settings → Service Accounts → Generate new private key

---

## Summary

1. ✅ Get service account JSON from Firebase Console
2. ✅ Add to `.env.local` as `FIREBASE_SERVICE_ACCOUNT_JSON`
3. ✅ Restart your dev server
4. ✅ Test signup - should work!

The error happens because Firebase Admin SDK (server-side) needs these credentials to create user accounts and manage authentication.
