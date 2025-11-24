# Product Images & Features Setup Guide

## Problem Identified

1. **Product images weren't saving properly** - Images were being stored as TEXT arrays in the products table without crop data
2. **No product features/attributes system** - No way to add specifications, variants, or product features
3. **No image cropping for products** - Product images lacked the cropping and aspect ratio features available for theme images

## Solution Implemented

### 1. Database Schema (Migration Created)

**File:** `supabase/migrations/20250124_add_product_images_and_attributes.sql`

**New Tables Created:**

#### `product_images` Table
- Stores product images with crop data
- Fields:
  - `id` (UUID)
  - `product_id` (references products)
  - `image_url` (TEXT)
  - `image_type` ('product', 'foreground', 'background')
  - `crop_x`, `crop_y`, `crop_width`, `crop_height` (crop coordinates)
  - `display_order` (for sorting)
  - `is_primary` (mark primary image)
  - `alt_text` (accessibility)

#### `product_attributes` Table
- Stores product features, specifications, and variant options
- Fields:
  - `id` (UUID)
  - `product_id` (references products)
  - `attribute_name` (e.g., "Color", "Size", "Material")
  - `attribute_value` (e.g., "Red", "XL", "Cotton")
  - `attribute_group` (optional: "Variant", "Specification", "Feature")
  - `is_variant` (if this affects SKU/pricing)
  - `price_modifier` (price adjustment for variants)
  - `stock_modifier` (stock specific to variant)

#### `product_variants` Table
- Stores specific product variants (combinations of attributes)
- Fields:
  - `id` (UUID)
  - `product_id` (references products)
  - `variant_name` (e.g., "Red / XL")
  - `sku` (unique SKU for variant)
  - `price_modifier` (price difference from base)
  - `stock` (variant-specific stock)
  - `attributes` (JSONB - e.g., {"Color": "Red", "Size": "XL"})
  - `image_url` (variant-specific image)

### 2. TypeScript Types Added

**File:** `src/lib/types.ts`

Added interfaces:
- `CropData` - Crop coordinates
- `ProductImage` - Image with crop data
- `ProductAttribute` - Product features/specs
- `ProductVariant` - Product variants
- Updated `Product` interface with new fields

### 3. Service Functions Created

**File:** `src/services/productImageService.ts`

Functions for managing:
- Product images with crop data
- Product attributes
- Product variants

**Functions:**
- `getProductImages(productId)` - Get all images for a product
- `saveProductImage(image)` - Add/update image with crop data
- `deleteProductImage(imageId)` - Remove image
- `getProductAttributes(productId)` - Get product attributes
- `saveProductAttribute(attribute)` - Add/update attribute
- `deleteProductAttribute(attributeId)` - Remove attribute
- `getProductVariants(productId)` - Get product variants

## How to Apply the Migration

You need to run the SQL migration to create the new tables in your Supabase database.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20250124_add_product_images_and_attributes.sql`
5. Paste into the SQL editor
6. Click **Run**

### Option 2: Supabase CLI (if installed)

```bash
# From project root
supabase db push
```

### Option 3: Manual Application

Connect to your Supabase database and run the migration file manually.

## Migration Features

The migration includes:

✅ **Creates 3 new tables** with proper indexes and constraints
✅ **Enables Row Level Security (RLS)** with appropriate policies
✅ **Migrates existing data** - Automatically moves images from TEXT arrays to the new `product_images` table
✅ **Backwards compatible** - Old fields remain functional during transition
✅ **Performance optimized** - Includes indexes on frequently queried fields

## Data Migration

The migration automatically:
1. Reads existing `product_images`, `foreground_images`, and `background_images` arrays from products table
2. Creates entries in the new `product_images` table
3. Sets first product image as primary
4. Preserves display order

**No data loss** - All existing images will be preserved!

## Next Steps

After applying the migration:

### 1. Update Product Form
Add image cropping UI similar to theme images:
- Pre-upload crop modal
- Post-upload crop editing
- Aspect ratio constraints
- Multi-screen preview

### 2. Add Attributes UI
Create interface for managing product features:
- Add/edit/delete attributes
- Group attributes (Specs vs Variants)
- Price modifiers for variants
- Stock tracking per variant

### 3. Update Product Display
Show cropped images and attributes on:
- Product detail pages
- Product cards/grids
- Cart items
- Order confirmations

## Benefits

### For Product Images:
✅ **Pixel-perfect cropping** - Precise control over image display
✅ **Multiple image types** - Product, foreground, background
✅ **Crop data saved** - No need to re-crop on edit
✅ **Better organization** - Images in dedicated table
✅ **Accessibility** - Alt text support

### For Product Attributes:
✅ **Flexible features** - Add any product specification
✅ **Variant support** - Colors, sizes, materials, etc.
✅ **Price variations** - Different pricing per variant
✅ **Stock management** - Track inventory by variant
✅ **Organized data** - Group related attributes

### For Product Variants:
✅ **Full variant support** - Combinations of attributes
✅ **Unique SKUs** - Track each variant separately
✅ **Variant images** - Show correct image per variant
✅ **Dynamic pricing** - Base price + modifiers

## File Structure

```
/home/heilige/lumo-app/
├── supabase/migrations/
│   └── 20250124_add_product_images_and_attributes.sql (NEW - Migration file)
├── src/
│   ├── lib/
│   │   └── types.ts (UPDATED - Added new interfaces)
│   └── services/
│       └── productImageService.ts (NEW - Service functions)
└── PRODUCT_IMAGES_SETUP.md (NEW - This file)
```

## Testing After Migration

1. **Verify tables created:**
   ```sql
   SELECT * FROM product_images LIMIT 5;
   SELECT * FROM product_attributes LIMIT 5;
   SELECT * FROM product_variants LIMIT 5;
   ```

2. **Check data migrated:**
   ```sql
   SELECT COUNT(*) FROM product_images;
   -- Should match total images from products table arrays
   ```

3. **Test RLS policies:**
   - Public users can view active product images
   - Admins can manage all images/attributes
   - Unauthenticated users can browse but not modify

## Questions?

- **Will this break existing functionality?** No - backwards compatible
- **What happens to old image fields?** They remain functional, new system runs in parallel
- **Can I rollback?** Yes - drop the three new tables if needed
- **Do I need to update all products?** No - migration handles existing data automatically

## Ready to Proceed?

1. ✅ Migration file created
2. ✅ Types defined
3. ✅ Service functions ready
4. ⏳ **Next:** Apply the SQL migration
5. ⏳ **Then:** Update product form UI
6. ⏳ **Finally:** Add attributes management UI

Let's apply the migration and continue! 🚀
