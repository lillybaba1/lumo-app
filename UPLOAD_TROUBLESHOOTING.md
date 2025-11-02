# Upload Troubleshooting Guide

## Issue: "Upload failed" Toast on Product Image Upload

If you see a red "Upload failed" toast when trying to upload product images, this guide will help you diagnose and fix the issue.

---

## Quick Diagnosis

### Step 1: Run the Diagnostic Endpoint

Visit this URL in your browser (while logged in):

```
http://localhost:3000/api/admin/diagnostics
```

Or in production:
```
https://your-site.vercel.app/api/admin/diagnostics
```

This will show you exactly what's wrong with a JSON response like:

```json
{
  "checks": {
    "authentication": { "status": "success", "details": "..." },
    "adminRole": { "status": "success", "details": "..." },
    "firebaseAdmin": { "status": "error", "details": "..." },
    "storageBucket": { "status": "error", "details": "..." }
  },
  "summary": "⚠️ 2 check(s) failed. Image upload may not work.",
  "recommendations": [...]
}
```

### Step 2: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try uploading an image
4. Look for the `/api/upload` request
5. Check the response:
   - **Status 401**: Not authenticated or not admin
   - **Status 400**: Invalid file type or size
   - **Status 500**: Server configuration issue

---

## Common Issues & Solutions

### Issue 1: Not Authenticated ❌

**Symptoms:**
- `/api/upload` returns 401 or redirects
- Diagnostic shows: `"authentication": { "status": "error" }`

**Solution:**

1. **Create Admin Account:**
   ```
   Go to: http://localhost:3000/admin/setup-first-admin
   ```
   Or in production:
   ```
   https://your-site.vercel.app/admin/setup-first-admin
   ```

2. **Fill in the form:**
   - Email: your-email@example.com
   - Password: (strong password)
   - Name: Your Name

3. **Login:**
   ```
   Go to: http://localhost:3000/admin/login
   ```

4. **Verify you're logged in:**
   - You should see admin dashboard
   - Top right should show your name

---

### Issue 2: Not Admin Role ❌

**Symptoms:**
- Logged in but still getting 401
- Diagnostic shows: `"adminRole": { "status": "error", "details": "User role is customer" }`

**Solution:**

Your account exists but doesn't have admin privileges.

**Option A: First Admin (if no admin exists)**
```
Visit: /admin/setup-first-admin
```

**Option B: Promote Existing User**

If you already have an admin account, use the Firebase Console:

1. Go to https://console.firebase.google.com/
2. Select your project: `lumo-app-183f5`
3. Go to **Firestore Database**
4. Find the **users** collection
5. Find your user document (by email)
6. Edit the document
7. Change `role` field from `"customer"` to `"admin"`
8. Save
9. **Logout and login again**

---

### Issue 3: Firebase Admin Not Initialized ❌

**Symptoms:**
- `/api/upload` returns 500
- Diagnostic shows: `"firebaseAdmin": { "status": "error" }`
- Error: "Firebase Admin SDK is not initialized"

**This is the most common issue for uploads!**

**Solution: Set Firebase Admin Credentials**

#### For Local Development (.env.local)

1. **Get Service Account JSON:**
   - Go to https://console.firebase.google.com/
   - Select project: `lumo-app-183f5`
   - Click ⚙️ (Settings) → **Project Settings**
   - Go to **Service accounts** tab
   - Click **"Generate new private key"**
   - Download the JSON file

2. **Add to .env.local:**

   Open or create `.env.local` file:

   ```bash
   # Option 1: JSON string (RECOMMENDED)
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"lumo-app-183f5","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@lumo-app-183f5.iam.gserviceaccount.com",...}'
   ```

   **IMPORTANT:** Copy the ENTIRE JSON file contents as a single line!

3. **Also add storage bucket:**
   ```bash
   FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
   ```

4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

#### For Production (Vercel/Netlify)

1. **Get the same Service Account JSON** (from steps above)

2. **Add to Vercel:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add new variable:
     - **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
     - **Value:** (paste entire JSON as single line)
     - **Environments:** Production, Preview, Development
   - Click **Save**

3. **Add Storage Bucket:**
   - **Name:** `FIREBASE_STORAGE_BUCKET`
   - **Value:** `lumo-app-183f5.firebasestorage.app`
   - **Environments:** Production, Preview, Development
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click ⋯ on latest deployment
   - Click **Redeploy**

#### For Production (Netlify)

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value:** (paste entire JSON)
6. Add:
   - **Key:** `FIREBASE_STORAGE_BUCKET`
   - **Value:** `lumo-app-183f5.firebasestorage.app`
7. Redeploy from **Deploys** tab

---

### Issue 4: Storage Bucket Not Configured ❌

**Symptoms:**
- Firebase Admin works but upload still fails
- Diagnostic shows: `"storageBucket": { "status": "error" }`
- Error: "Firebase Storage bucket not available"

**Solution:**

Add the `FIREBASE_STORAGE_BUCKET` environment variable:

**Local (.env.local):**
```bash
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
```

**Vercel/Netlify:**
Add environment variable:
- Name: `FIREBASE_STORAGE_BUCKET`
- Value: `lumo-app-183f5.firebasestorage.app`

Then restart/redeploy.

---

### Issue 5: Invalid File Type or Size ❌

**Symptoms:**
- `/api/upload` returns 400
- Error: "File type not allowed" or "File size exceeds maximum"

**Solution:**

Check file constraints:

**Allowed File Types:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`)
- SVG (`.svg`)

**Maximum File Size:**
- 10 MB (10,485,760 bytes)

**To upload larger files:**

Edit `src/app/api/upload/route.ts`:

```typescript
// Change this line:
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// To (for example, 20MB):
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
```

---

## Step-by-Step Verification

### 1. Check Environment Variables

```bash
# Local development
cat .env.local | grep FIREBASE
```

Should show:
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
FIREBASE_COOKIE_NAME=session
```

### 2. Check Admin Status

```bash
# Visit diagnostics endpoint
curl http://localhost:3000/api/admin/diagnostics
```

Or open in browser while logged in.

### 3. Test Upload Manually

Open browser console and run:

```javascript
// Test upload with a small file
const testUpload = async () => {
  // Create a tiny test image
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

  const formData = new FormData();
  formData.append('file', blob, 'test.png');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  console.log('Status:', response.status);
  console.log('Result:', result);
};

testUpload();
```

**Expected success response:**
```json
{
  "url": "https://storage.googleapis.com/lumo-app-183f5.firebasestorage.app/uploads/...",
  "fileName": "test.png",
  "fileSize": 1234,
  "fileType": "image/png"
}
```

---

## Quick Fix Checklist

Use this checklist to fix upload issues:

- [ ] **Logged in?** Visit `/admin/login`
- [ ] **Admin role?** Check in Firebase Console or visit `/api/admin/diagnostics`
- [ ] **Service account JSON set?** Check `.env.local` or Vercel settings
- [ ] **Storage bucket set?** Check environment variables
- [ ] **Dev server restarted?** Run `npm run dev` again after changing .env.local
- [ ] **Production redeployed?** Redeploy after changing Vercel environment variables
- [ ] **File type valid?** Use JPEG, PNG, WebP, GIF, or SVG
- [ ] **File size under 10MB?** Check file size
- [ ] **Browser cache cleared?** Hard refresh (Ctrl+Shift+R)

---

## Still Not Working?

### Check Server Logs

**Local Development:**
Look at your terminal where `npm run dev` is running for error messages.

**Production (Vercel):**
1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Deployments**
4. Click latest deployment
5. Click **View Function Logs**
6. Look for errors from `/api/upload`

**Production (Netlify):**
1. Go to your Netlify dashboard
2. Click your site
3. Go to **Logs** → **Functions**
4. Look for errors from upload function

### Check Firebase Console

1. Go to https://console.firebase.google.com/
2. Select project: `lumo-app-183f5`
3. Go to **Storage**
4. Check if bucket exists and has correct permissions
5. Go to **Authentication** → **Users**
6. Verify your account exists and has correct email

### Common Error Messages

| Error Message | Solution |
|---------------|----------|
| "Authentication required" | Login at `/admin/login` |
| "Insufficient permissions" | Make sure role is "admin" in Firestore |
| "Firebase Admin not initialized" | Set `FIREBASE_SERVICE_ACCOUNT_JSON` |
| "Storage bucket not available" | Set `FIREBASE_STORAGE_BUCKET` |
| "File type not allowed" | Use JPEG, PNG, WebP, GIF, or SVG |
| "File size exceeds maximum" | Use file under 10MB |

---

## Testing After Fix

After fixing the issue:

1. **Clear browser cache:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Verify diagnostics:**
   ```
   Visit: /api/admin/diagnostics
   ```
   All checks should show `"status": "success"`

3. **Test upload:**
   - Go to `/admin/products/add`
   - Click "Upload Images"
   - Select a valid image file
   - Should see green "Image uploaded successfully" toast

4. **Verify file in storage:**
   - Check Firebase Console → Storage
   - Should see your file in `uploads/` folder
   - File should be publicly accessible

---

## Environment Variables Reference

Complete list of environment variables needed for uploads:

```bash
# Firebase Admin SDK (REQUIRED for uploads)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Firebase Storage (REQUIRED for uploads)
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app

# Session cookies (REQUIRED for authentication)
FIREBASE_COOKIE_NAME=session

# Firebase Client (Public - REQUIRED for app to work)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI (REQUIRED for AI assistant)
GOOGLE_API_KEY=your_google_ai_key
```

---

## Support

If you're still having issues after following this guide:

1. **Check GitHub Issues:** https://github.com/lillybaba1/lumo-app/issues
2. **Review Documentation:**
   - `DEPLOY_NOW.md` - Deployment guide
   - `DEPLOYMENT_GUIDE.md` - Comprehensive deployment
   - `IMPROVEMENTS.md` - All changes made
3. **Check Console Logs:** Browser console and server logs
4. **Verify Setup:** Use `/api/admin/diagnostics` endpoint

---

**Last Updated:** 2025-11-02
**Status:** Complete troubleshooting guide
