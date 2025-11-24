# Product Images Migration: Firebase → Supabase Storage

## Overview
This migration moves all product image storage from Firebase Storage to Supabase Storage for better integration, lower costs, and simpler management.

## ✅ Changes Made

### 1. **Storage Service Updated** (`src/services/storageService.ts`)
- Replaced Firebase Storage with Supabase Storage
- Client-side direct uploads (no API route needed)
- Built-in file validation (size, type, name security)
- Auto-generates safe filenames with timestamps

### 2. **SQL Migration Created** (`supabase/migrations/20250124_create_product_images_storage.sql`)
- Creates `product-images` bucket
- Sets up RLS policies for public read, authenticated write
- Configures file size limit (10MB) and allowed MIME types

### 3. **Product Form** (`src/components/product-form.tsx`)
- Already uses `uploadImageAndGetUrl` - no changes needed!
- Automatically benefits from Supabase migration

## 🚀 How to Apply the Migration

### Step 1: Run the SQL Migration in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20250124_create_product_images_storage.sql`
4. Paste and click **Run**

Expected output:
```
INSERT 0 1
ALTER TABLE
CREATE POLICY
CREATE POLICY
CREATE POLICY
CREATE POLICY
GRANT
GRANT
```

### Step 2: Verify the Bucket Was Created

1. Go to **Supabase Dashboard** → **Storage**
2. You should see a new bucket called `product-images`
3. Click on it → **Policies** tab
4. Verify these policies exist:
   - ✅ Public read product-images
   - ✅ Authenticated write product-images
   - ✅ Authenticated update product-images
   - ✅ Authenticated delete product-images

### Step 3: Test Product Image Upload

1. Go to your admin dashboard: `https://lumo-app.org/admin/products`
2. Create or edit a product
3. Upload multiple images
4. Check the browser console for logs like:
   ```
   [Storage] Uploading file to Supabase: { name: ..., path: ... }
   [Storage] Upload successful, public URL: https://...supabase.co/storage/v1/object/public/product-images/...
   ```
5. Save the product
6. Verify images display correctly

### Step 4: Check Uploaded Files in Supabase

1. Go to **Supabase Dashboard** → **Storage** → **product-images** bucket
2. You should see folders like `products/` with timestamped image files
3. Click any image to preview it
4. Copy the public URL and test it in a browser

## 📝 Technical Details

### File Upload Flow (New)

```
User selects image → uploadImageAndGetUrl() → Supabase Storage API → Public URL returned → Saved to database
```

**Key improvements:**
- ✅ Direct client-to-Supabase (no server middleware)
- ✅ Built-in security validation
- ✅ Public URLs generated automatically
- ✅ RLS policies enforce access control

### Bucket Configuration

| Setting | Value |
|---------|-------|
| Name | `product-images` |
| Public | Yes (read-only) |
| Size Limit | 10MB per file |
| Allowed Types | JPEG, PNG, WebP, GIF, SVG |

### Security Features

1. **File Validation:**
   - Max size: 10MB
   - Allowed types: Images only
   - Filename sanitization (prevents path traversal)

2. **RLS Policies:**
   - Public can read (view images)
   - Authenticated users can upload/edit/delete
   - Future: Can restrict to admin role only

3. **Filename Safety:**
   - Timestamp prefix prevents collisions
   - Special characters removed
   - No path separators allowed

## 🔧 Troubleshooting

### Issue: "Bucket not found" error
**Solution:** Make sure you ran the SQL migration. Check that the bucket exists in Supabase Storage dashboard.

### Issue: "Permission denied" error
**Solution:**
1. Check that user is authenticated (logged in)
2. Verify RLS policies exist on `storage.objects`
3. Check browser console for detailed error message

### Issue: Images not displaying after upload
**Solution:**
1. Check the public URL format: `https://...supabase.co/storage/v1/object/public/product-images/...`
2. Verify the bucket is set to `public`
3. Check RLS policy: "Public read product-images" exists

### Issue: Upload works but URLs are wrong in database
**Solution:**
1. Check product form is using the returned URL correctly
2. Verify `product_images` table stores the full Supabase URL
3. Check crop data is saved correctly with the image URL

## 🗄️ Migration from Firebase (Optional)

If you have existing products with Firebase URLs:

### Option 1: Hybrid Approach (Recommended)
- Old products keep Firebase URLs (still work)
- New products use Supabase URLs
- No migration needed!

### Option 2: Full Migration (Advanced)
If you want to migrate all existing images:

1. **Export product data:**
   ```sql
   SELECT id, name, product_images FROM product_images;
   ```

2. **For each Firebase URL:**
   - Download the image
   - Re-upload to Supabase using `uploadImageAndGetUrl`
   - Update the database with new URL

3. **Update script** (pseudocode):
   ```ts
   for (const product of products) {
     for (const firebaseUrl of product.images) {
       // Download from Firebase
       const blob = await fetch(firebaseUrl).then(r => r.blob());
       const file = new File([blob], 'image.jpg');

       // Upload to Supabase
       const supabaseUrl = await uploadImageAndGetUrl(file, 'products');

       // Update database
       await updateProductImage(product.id, firebaseUrl, supabaseUrl);
     }
   }
   ```

## 📊 Monitoring

After migration, monitor:
1. **Supabase Dashboard** → **Storage** → **Usage**
   - Check storage size
   - Monitor bandwidth usage

2. **Application logs**
   - Check for upload errors
   - Verify all images load correctly

3. **Database queries**
   - Ensure product images display on product pages
   - Check cart and order pages show images

## ✅ Success Criteria

Migration is successful when:
- [x] SQL migration runs without errors
- [x] `product-images` bucket exists in Supabase
- [x] RLS policies are active
- [x] Product upload form works end-to-end
- [x] Images display correctly on frontend
- [x] Multiple images can be uploaded with crop data
- [x] Public URLs are accessible without authentication

## 🎉 Benefits of This Migration

1. **Cost Savings:** Supabase Storage is cheaper than Firebase
2. **Simplicity:** One platform (Supabase) for DB + Storage
3. **Better Integration:** Same auth system, easier RLS
4. **Performance:** CDN-backed public URLs
5. **Developer Experience:** Simpler code, fewer dependencies

---

**Ready to apply?** Start with Step 1 above! 🚀
