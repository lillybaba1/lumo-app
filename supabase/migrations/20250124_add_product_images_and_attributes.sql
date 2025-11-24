-- ============================================
-- Product Images and Attributes Tables
-- Migration: Add proper image management and product features
-- ============================================

-- ============================================
-- PRODUCT IMAGES TABLE
-- ============================================
-- Separate table for product images with crop data and metadata
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Image URL and type
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('product', 'foreground', 'background')),

  -- Crop data (pixel coordinates)
  crop_x INTEGER,
  crop_y INTEGER,
  crop_width INTEGER,
  crop_height INTEGER,

  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT ATTRIBUTES TABLE
-- ============================================
-- For product features, specifications, and variant options
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Attribute details
  attribute_name TEXT NOT NULL, -- e.g., "Color", "Size", "Material", "Storage"
  attribute_value TEXT NOT NULL, -- e.g., "Red", "XL", "Cotton", "256GB"
  attribute_group TEXT, -- Optional grouping: "Variant", "Specification", "Feature"

  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_variant BOOLEAN DEFAULT false, -- True if this affects SKU/pricing

  -- Pricing modifier for variants (optional)
  price_modifier DECIMAL(10,2) DEFAULT 0, -- +/- price adjustment
  stock_modifier INTEGER DEFAULT 0, -- Stock specific to this variant

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique attribute name-value pairs per product
  UNIQUE(product_id, attribute_name, attribute_value)
);

-- ============================================
-- PRODUCT VARIANTS TABLE
-- ============================================
-- For specific product variants (combinations of attributes)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Variant details
  variant_name TEXT NOT NULL, -- e.g., "Red / XL", "256GB / Black"
  sku TEXT UNIQUE,

  -- Pricing and stock
  price_modifier DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,

  -- Variant attributes (JSONB for flexibility)
  attributes JSONB DEFAULT '{}', -- e.g., {"Color": "Red", "Size": "XL"}

  -- Image specific to this variant
  image_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_type ON public.product_images(image_type);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_product_images_order ON public.product_images(product_id, display_order);

CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON public.product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_name ON public.product_attributes(attribute_name);
CREATE INDEX IF NOT EXISTS idx_product_attributes_variant ON public.product_attributes(is_variant) WHERE is_variant = true;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Product Images: Public read for active products, admin write
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE id = product_images.product_id
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Product Attributes: Public read for active products, admin write
CREATE POLICY "Anyone can view product attributes"
  ON public.product_attributes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE id = product_attributes.product_id
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage product attributes"
  ON public.product_attributes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Product Variants: Public read for active products and variants, admin write
CREATE POLICY "Anyone can view active product variants"
  ON public.product_variants FOR SELECT
  USING ((EXISTS (
    SELECT 1 FROM public.products
    WHERE id = product_variants.product_id
    AND is_active = true
  ) AND is_active = true) OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage product variants"
  ON public.product_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_attributes_updated_at
  BEFORE UPDATE ON public.product_attributes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DATA MIGRATION
-- ============================================
-- Migrate existing product images from TEXT arrays to product_images table
-- This will move images from the products table columns to the new product_images table

DO $$
DECLARE
  product_record RECORD;
  img_url TEXT;
  img_order INTEGER;
BEGIN
  -- Loop through all products
  FOR product_record IN SELECT id, product_images, foreground_images, background_images FROM public.products LOOP

    -- Migrate product images
    IF product_record.product_images IS NOT NULL THEN
      img_order := 0;
      FOREACH img_url IN ARRAY product_record.product_images LOOP
        INSERT INTO public.product_images (product_id, image_url, image_type, display_order, is_primary)
        VALUES (product_record.id, img_url, 'product', img_order, img_order = 0)
        ON CONFLICT DO NOTHING;
        img_order := img_order + 1;
      END LOOP;
    END IF;

    -- Migrate foreground images
    IF product_record.foreground_images IS NOT NULL THEN
      img_order := 0;
      FOREACH img_url IN ARRAY product_record.foreground_images LOOP
        INSERT INTO public.product_images (product_id, image_url, image_type, display_order)
        VALUES (product_record.id, img_url, 'foreground', img_order)
        ON CONFLICT DO NOTHING;
        img_order := img_order + 1;
      END LOOP;
    END IF;

    -- Migrate background images
    IF product_record.background_images IS NOT NULL THEN
      img_order := 0;
      FOREACH img_url IN ARRAY product_record.background_images LOOP
        INSERT INTO public.product_images (product_id, image_url, image_type, display_order)
        VALUES (product_record.id, img_url, 'background', img_order)
        ON CONFLICT DO NOTHING;
        img_order := img_order + 1;
      END LOOP;
    END IF;

  END LOOP;
END $$;

-- ============================================
-- COMPLETED
-- ============================================
-- Migration completed successfully!
-- New tables: product_images, product_attributes, product_variants
-- Existing product images migrated to new structure
