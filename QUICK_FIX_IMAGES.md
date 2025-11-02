# Quick Fix: Firebase Images Not Working

## 🚨 Problem
- ❌ Images not displaying
- ❌ Upload failing

## ⚡ 3-Step Quick Fix

### Step 1: Set Up Environment (5 min)

```bash
npm run setup:firebase
```

Follow the prompts to add your Firebase credentials.

**What you need:**
- Firebase Service Account JSON from [Firebase Console](https://console.firebase.google.com/project/lumo-app-183f5/settings/serviceaccounts/adminsdk)

### Step 2: Configure CORS (2 min)

**Option A: Using gsutil (if you have Google Cloud SDK)**
```bash
gsutil cors set cors.json gs://lumo-app-183f5.firebasestorage.app
```

**Option B: Using Firebase Console**
1. Go to https://console.firebase.google.com/project/lumo-app-183f5/storage
2. Click **Rules** tab
3. Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
4. Click **Publish**

### Step 3: Restart Dev Server

```bash
npm run dev
```

## ✅ Test It

1. Login: http://localhost:3000/admin/login
2. Add Product: http://localhost:3000/admin/products/add
3. Upload image → Should work ✅
4. View product → Image should display ✅

## 🆘 Still Not Working?

Run diagnostics:
```bash
npm run verify:upload
```

Check browser console (F12) for errors.

---

**Full guide:** See `FIREBASE_IMAGE_FIX.md` for detailed instructions.
