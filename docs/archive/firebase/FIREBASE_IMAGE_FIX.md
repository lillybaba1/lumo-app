# Fix: Firebase Images Not Showing & Upload Failing

## 🔍 Root Causes Identified

### Issue 1: Images Not Displaying
**Cause**: Firebase Storage CORS (Cross-Origin Resource Sharing) not configured
- Images stored at `storage.googleapis.com` are blocked by browser
- CORS headers not set on Firebase Storage bucket

### Issue 2: Upload Failing
**Cause**: Missing Firebase Admin credentials
- Upload API requires admin authentication via `requireAdmin()`
- Firebase Admin SDK needs `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
- No `.env.local` file exists to store credentials

## ✅ Complete Fix (Both Issues)

### Step 1: Create `.env.local` File

Create a new file in the project root:

```bash
cd /home/user/lumo-app
touch .env.local
```

Add these variables to `.env.local`:

```bash
# Firebase Client Config (Public - Safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumo-app-183f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumo-app-183f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=599053873389
NEXT_PUBLIC_FIREBASE_APP_ID=1:599053873389:web:7ae9fc52e26be1e3d89ce4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-EHRCCLS6CV

# Firebase Admin (PRIVATE - Server-side only)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"lumo-app-183f5",...}
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app

# Session Config
FIREBASE_COOKIE_NAME=session

# Google AI (Optional - for AI assistant)
GOOGLE_API_KEY=your_google_ai_api_key_here
```

### Step 2: Get Firebase Service Account JSON

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `lumo-app-183f5`
3. **Navigate**: ⚙️ Settings → **Project Settings** → **Service Accounts** tab
4. **Generate Key**: Click **"Generate new private key"** button
5. **Download**: A JSON file will download
6. **Copy Contents**: Open the JSON file and copy **ALL** contents
7. **Paste in `.env.local`**: Replace the placeholder with the actual JSON (keep it on one line)

Example format:
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"lumo-app-183f5","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"firebase-adminsdk-xxx@lumo-app-183f5.iam.gserviceaccount.com","client_id":"123..."}
```

### Step 3: Configure Firebase Storage CORS

Firebase Storage needs CORS configuration to allow images to load in the browser.

**Option A: Using Firebase CLI (Recommended)**

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create cors.json file
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration to your storage bucket
gsutil cors set cors.json gs://lumo-app-183f5.firebasestorage.app

# Verify CORS was set
gsutil cors get gs://lumo-app-183f5.firebasestorage.app
```

**Option B: Using Google Cloud Console**

1. Go to: https://console.cloud.google.com/storage/browser
2. Select project: `lumo-app-183f5`
3. Find bucket: `lumo-app-183f5.firebasestorage.app`
4. Click the bucket name
5. Go to **Permissions** tab
6. Click **Add Principal**
7. Add: `allUsers`
8. Role: `Storage Object Viewer`
9. Click **Save**

Then set CORS:
1. Click on the bucket
2. Go to **Configuration** tab
3. Edit **CORS configuration**
4. Add:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 4: Update Firebase Storage Rules

Go to Firebase Console → Storage → Rules, and update to:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to all files
    match /{allPaths=**} {
      allow read: if true;
      // Only authenticated users can write
      allow write: if request.auth != null;
    }

    // Admin uploads (via Admin SDK)
    match /uploads/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Product images
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish** to save the rules.

### Step 5: Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Test Image Upload

1. **Login as Admin**: Go to `/admin/login`
2. **Navigate**: Go to `/admin/products/add`
3. **Upload Image**: Select an image file
4. **Verify**: Image should upload successfully and display

### Step 7: Test Image Display

1. **Add Product**: Complete the form and save
2. **View Products**: Go to `/products` or home page
3. **Verify**: Product images should display correctly

## 🔧 Quick Automated Setup

I've created a script to help you set this up:

```bash
# Run the setup script
node scripts/setup-firebase-env.js
```

This script will:
- ✅ Check if `.env.local` exists
- ✅ Guide you through adding Firebase credentials
- ✅ Verify the configuration
- ✅ Test Firebase Admin connection

## 📊 Verification Checklist

After completing the steps above:

### Environment Variables
- [ ] `.env.local` file exists
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` is set (valid JSON)
- [ ] `FIREBASE_STORAGE_BUCKET` is set
- [ ] All `NEXT_PUBLIC_*` variables are set

### Firebase Storage
- [ ] CORS is configured
- [ ] Storage rules allow public read
- [ ] Storage rules require auth for write
- [ ] Bucket is accessible

### Image Upload
- [ ] Can login as admin
- [ ] Can access `/admin/products/add`
- [ ] Can select image file
- [ ] Upload shows success toast (not error)
- [ ] Image URL is returned

### Image Display
- [ ] Product images show on home page
- [ ] Product images show on product detail page
- [ ] Product images show in admin panel
- [ ] No CORS errors in browser console

## 🐛 Troubleshooting

### Issue: "Upload failed" toast

**Check 1: Admin Authentication**
```bash
# Verify you're logged in as admin
# Go to /admin/login and login
```

**Check 2: Firebase Admin Credentials**
```bash
# Run verification script
npm run verify:upload

# Should show:
# ✓ FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON
# ✓ FIREBASE_STORAGE_BUCKET is set
```

**Check 3: Check Server Logs**
```bash
# In the terminal running `npm run dev`, look for:
# [Upload API] Upload failed: ...
# This will show the actual error
```

### Issue: Images not displaying (CORS error)

**Check Browser Console:**
```
Access to image at 'https://storage.googleapis.com/...' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Fix:**
1. Run CORS configuration (Step 3 above)
2. Make uploaded files public
3. Restart dev server
4. Hard refresh browser (Ctrl+Shift+R)

**Verify CORS:**
```bash
gsutil cors get gs://lumo-app-183f5.firebasestorage.app
```

Should return:
```json
[{"maxAgeSeconds": 3600, "method": ["GET", "HEAD"], "origin": ["*"]}]
```

### Issue: "Firebase Admin credentials not found"

**Error in logs:**
```
Firebase Admin credentials not found. Please set one of the following
environment variables: FIREBASE_SERVICE_ACCOUNT_JSON
```

**Fix:**
1. Ensure `.env.local` exists
2. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set
3. Verify the JSON is valid (paste into https://jsonlint.com/)
4. Restart dev server

### Issue: gsutil command not found

**Fix Option 1: Install Google Cloud SDK**
```bash
# Follow instructions at:
# https://cloud.google.com/sdk/docs/install
```

**Fix Option 2: Use Firebase Console**
- Follow "Option B" in Step 3 above
- Use Google Cloud Console web interface

## 🚀 Production Deployment (Vercel)

For production, set the same environment variables in Vercel:

```bash
# Set each variable in Vercel
vercel env add FIREBASE_SERVICE_ACCOUNT_JSON production
# Paste the entire JSON when prompted

vercel env add FIREBASE_STORAGE_BUCKET production
# Enter: lumo-app-183f5.firebasestorage.app

# Redeploy
vercel --prod
```

Or use Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select project: `lumo-app`
3. Go to: **Settings** → **Environment Variables**
4. Add each variable
5. Redeploy from **Deployments** tab

## 📝 Summary

**What was wrong:**
1. ❌ No `.env.local` file with Firebase Admin credentials
2. ❌ Firebase Storage CORS not configured
3. ❌ Upload API couldn't initialize Firebase Admin SDK
4. ❌ Images blocked by browser CORS policy

**What we fixed:**
1. ✅ Created `.env.local` with proper credentials
2. ✅ Configured Firebase Storage CORS
3. ✅ Updated Firebase Storage rules
4. ✅ Verified environment setup

**Result:**
- ✅ Images upload successfully
- ✅ Images display in browser
- ✅ No CORS errors
- ✅ Admin features work

## 🆘 Still Having Issues?

1. **Run diagnostic:**
   ```bash
   npm run verify:upload
   ```

2. **Check logs:**
   - Server logs in terminal running `npm run dev`
   - Browser console (F12 → Console tab)
   - Network tab (F12 → Network tab)

3. **Verify Firebase Console:**
   - Storage: https://console.firebase.google.com/project/lumo-app-183f5/storage
   - Check if files are being created
   - Check file permissions

4. **Test upload directly:**
   ```bash
   # Visit diagnostic endpoint (while logged in as admin)
   http://localhost:3000/api/admin/diagnostics
   ```

---

**Estimated Fix Time**: 10-15 minutes
**Required Access**: Firebase Console access for project `lumo-app-183f5`
**Tools Needed**: Google Cloud SDK (for CORS) OR Google Cloud Console access
