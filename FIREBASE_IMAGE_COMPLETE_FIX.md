# Firebase Image Issues - Complete Fix Guide

## 🐛 Problem Report

Images are not displaying in the Lumo app:
- ❌ Product images not showing on homepage
- ❌ Product images not showing in product details
- ❌ Hero background images not showing
- ❌ Hero foreground images not showing
- ❌ Cart images not showing

## 🔍 Root Causes Identified

### 1. Missing `unoptimized` Flag on Next.js Image Components
Some Next.js Image components were missing the `unoptimized` attribute needed for Firebase Storage URLs.

### 2. Firebase Storage Configuration Issues
Possible CORS or permissions issues preventing images from loading.

### 3. Incorrect Image URLs in Database
Images may have wrong URLs or paths in Firestore database.

## ✅ Fixes Applied

### Fix 1: Added `unoptimized` to Product Card
**File:** `src/components/product-card.tsx`

**Before:**
```tsx
<Image
  src={imageUrl}
  alt={product.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  data-ai-hint={`${product.category}...`}
/>
```

**After:**
```tsx
<Image
  src={imageUrl}
  alt={product.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  unoptimized  // ← ADDED
  data-ai-hint={`${product.category}...`}
/>
```

### Fix 2: Added `unoptimized` to Cart Page
**File:** `src/app/cart/page.tsx`

**Before:**
```tsx
<Image
  src={product.imageUrls[0]}
  alt={product.name}
  width={80}
  height={80}
  className="rounded-md"
/>
```

**After:**
```tsx
<Image
  src={product.imageUrls[0]}
  alt={product.name}
  width={80}
  height={80}
  className="rounded-md"
  unoptimized  // ← ADDED
/>
```

### Fix 3: Verify next.config.ts Configuration
**File:** `next.config.ts`

Already configured correctly:
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'placehold.co',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'storage.googleapis.com',  // ← Firebase Storage domain
      port: '',
      pathname: '/**',
    },
  ],
}
```

## 🧪 How to Test the Fixes

### Step 1: Check Browser Console

1. Open your app in browser
2. Press F12 → Console tab
3. Look for errors:
   - ❌ CORS errors
   - ❌ 403 Forbidden errors
   - ❌ Failed to load resource errors

### Step 2: Check Image URLs

1. Inspect a product card
2. Right-click the image area
3. Check if `src` attribute has a valid URL
4. Expected format: `https://storage.googleapis.com/lumo-app-183f5.firebasestorage.app/...`

### Step 3: Test Image Loading Directly

Open a product image URL in a new tab:
```
https://storage.googleapis.com/lumo-app-183f5.firebasestorage.app/products/...
```

**If 403 Forbidden:**
- Firebase Storage permissions issue
- Need to configure Storage Rules

**If 404 Not Found:**
- Image doesn't exist in Firebase Storage
- Need to upload images

**If CORS error:**
- Need to configure CORS on Firebase Storage

## 🔧 Additional Troubleshooting Steps

### Issue: Images Still Not Showing After Fixes

#### Check 1: Firebase Storage Rules

Go to Firebase Console → Storage → Rules

**Current rules should be:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Public read access
      allow write: if request.auth != null;  // Auth required for write
    }
  }
}
```

**If different, update and publish.**

#### Check 2: Firebase Storage CORS

CORS must be configured to allow browser access.

**Apply CORS configuration:**
```bash
gsutil cors set cors.json gs://lumo-app-183f5.firebasestorage.app
```

**If you don't have gsutil:**

1. Go to https://console.cloud.google.com/storage/browser
2. Select project: `lumo-app-183f5`
3. Find bucket: `lumo-app-183f5.firebasestorage.app`
4. Click on bucket → Permissions
5. Add principal: `allUsers`
6. Role: `Storage Object Viewer`
7. Save

#### Check 3: Images Actually Exist in Firebase Storage

1. Go to Firebase Console → Storage
2. Navigate to `uploads/` and `products/` folders
3. Verify images are there
4. Click on an image → Copy public URL
5. Test URL in browser

**If no images:**
- Need to upload images via admin panel
- Go to `/admin/products/add`
- Upload images for products

#### Check 4: Database Has Correct Image URLs

**Check Firestore:**
1. Go to Firebase Console → Firestore Database
2. Open `products` collection
3. Check a product document
4. Look for `imageUrls` field
5. Verify it contains valid URLs

**Expected format:**
```json
{
  "imageUrls": [
    "https://storage.googleapis.com/lumo-app-183f5.firebasestorage.app/products/1234_image.jpg"
  ]
}
```

**If empty or wrong format:**
- Re-upload images via admin panel
- Images will be stored and URLs saved automatically

#### Check 5: Environment Variables Set

Verify Firebase credentials are configured:

**Development (.env.local):**
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
```

**Production (Vercel):**
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set
- Verify `FIREBASE_STORAGE_BUCKET` is set

#### Check 6: Clear Cache and Rebuild

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build

# Restart dev server
npm run dev
```

## 📝 Complete Checklist

Use this checklist to verify everything is working:

### Image Display:
- [ ] Product images show on homepage
- [ ] Product images show on product detail page
- [ ] Product images show in cart
- [ ] Product images show in admin panel
- [ ] Hero background image shows on homepage
- [ ] Hero foreground image shows on homepage
- [ ] Wishlist images show
- [ ] Order history images show

### Upload & Storage:
- [ ] Can upload images via admin panel
- [ ] Upload shows success message
- [ ] Images appear immediately after upload
- [ ] Images persist after page refresh
- [ ] Images accessible via direct URL

### Firebase Configuration:
- [ ] Firebase Storage rules allow public read
- [ ] CORS configured on Firebase Storage bucket
- [ ] Environment variables set (dev & production)
- [ ] Firebase Admin SDK initialized
- [ ] Storage bucket exists and is accessible

### Next.js Configuration:
- [ ] storage.googleapis.com in remotePatterns
- [ ] Images use `unoptimized` flag
- [ ] No console errors related to images
- [ ] Build completes successfully

## 🆘 Still Having Issues?

### Debug Mode

Add console logs to track image loading:

**In product-card.tsx:**
```tsx
const imageUrl = product.imageUrls && product.imageUrls.length > 0
  ? product.imageUrls[0]
  : 'https://placehold.co/600x600.png';

console.log('Product:', product.name);
console.log('Image URL:', imageUrl);
console.log('Has imageUrls:', !!product.imageUrls);
console.log('imageUrls length:', product.imageUrls?.length);
```

Check browser console to see what URLs are being used.

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Img"
4. Reload page
5. Check which images are loading/failing
6. Click failed requests to see error details

### Common Error Messages

**"Failed to load resource: net::ERR_FAILED"**
- CORS issue
- Fix: Configure CORS on Firebase Storage

**"Access to image at 'https://storage.googleapis.com/...' blocked by CORS policy"**
- CORS not configured
- Fix: Run `gsutil cors set cors.json gs://...`

**"403 Forbidden"**
- Storage permissions issue
- Fix: Update Firebase Storage Rules to allow public read

**"404 Not Found"**
- Image doesn't exist
- Fix: Upload images via admin panel

**"Invalid src prop on 'next/image'"**
- Malformed URL
- Fix: Check imageUrls format in database

## 📊 Summary of Changes

### Files Modified:
1. **src/components/product-card.tsx** - Added `unoptimized` flag
2. **src/app/cart/page.tsx** - Added `unoptimized` flag

### Why These Changes?

**`unoptimized` flag:**
- Next.js Image component tries to optimize images by default
- Firebase Storage URLs don't work with Next.js image optimization
- Adding `unoptimized` bypasses optimization and loads images directly
- This is standard practice for external image sources

**Already had `unoptimized`:**
- Hero 3D component (background & foreground)
- Product form preview
- Admin appearance previews
- Product detail carousel
- Wishlist page
- Admin products page

## 🎯 Expected Behavior After Fixes

✅ **Product cards on homepage** - Show product images
✅ **Product detail page** - Show all product images in carousel
✅ **Cart page** - Show thumbnail images for cart items
✅ **Hero section** - Show background and foreground images
✅ **Admin panel** - Show product images and previews
✅ **No console errors** - No CORS or loading errors

## 🚀 Next Steps

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Test in browser:**
   - Visit http://localhost:3000
   - Check if product images show
   - Check browser console for errors

3. **If images still don't show:**
   - Check Firebase Storage (step by step above)
   - Verify CORS configuration
   - Verify Storage Rules
   - Upload test images via admin panel

4. **Deploy to production:**
   ```bash
   git push origin claude/merge-to-master-011CUj57Xb1VtERZ33txH1nB
   # Then merge to master and redeploy on Vercel
   ```

---

**Status:** ✅ Code fixes applied
**Next:** Verify Firebase Storage configuration
**Then:** Test image display
**Finally:** Deploy to production
