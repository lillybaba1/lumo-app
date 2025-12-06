-- Migration: Advanced Product Features
-- Description: Product variants, inventory alerts, pre-orders

-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  option_values JSONB NOT NULL DEFAULT '{}', -- e.g., {"size": "M", "color": "Blue"}
  price_adjustment DECIMAL(10,2) DEFAULT 0, -- +/- from base price
  stock_quantity INT DEFAULT 0,
  image_url TEXT,
  weight DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product options (define available options like Size, Color)
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Size", "Color"
  display_type TEXT DEFAULT 'dropdown' CHECK (display_type IN ('dropdown', 'radio', 'color_swatch', 'image_swatch')),
  values JSONB NOT NULL DEFAULT '[]', -- e.g., ["S", "M", "L", "XL"]
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory alerts
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'back_in_stock')),
  threshold INT DEFAULT 10, -- for low_stock alerts
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-orders configuration
CREATE TABLE IF NOT EXISTS product_preorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_preorder BOOLEAN DEFAULT FALSE,
  available_date DATE,
  deposit_required BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10,2),
  deposit_percentage DECIMAL(5,2),
  max_preorder_quantity INT,
  preorder_message TEXT,
  shipping_estimate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Product tags for better organization
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id, slug)
);

-- Junction table for product-tag relationship
CREATE TABLE IF NOT EXISTS product_tag_assignments (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_options_product ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_alerts_boutique ON inventory_alerts(boutique_id);
CREATE INDEX IF NOT EXISTS idx_alerts_product ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_preorders_product ON product_preorders(product_id);
CREATE INDEX IF NOT EXISTS idx_tags_boutique ON product_tags(boutique_id);

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_preorders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (in case they exist from previous migrations)
DROP POLICY IF EXISTS "Anyone can view active variants" ON product_variants;
DROP POLICY IF EXISTS "Sellers can manage their product variants" ON product_variants;
DROP POLICY IF EXISTS "Anyone can view product options" ON product_options;
DROP POLICY IF EXISTS "Sellers can manage their product options" ON product_options;
DROP POLICY IF EXISTS "Sellers can manage their inventory alerts" ON inventory_alerts;
DROP POLICY IF EXISTS "Anyone can view preorder settings" ON product_preorders;
DROP POLICY IF EXISTS "Sellers can manage their preorder settings" ON product_preorders;
DROP POLICY IF EXISTS "Anyone can view tags" ON product_tags;
DROP POLICY IF EXISTS "Sellers can manage their tags" ON product_tags;
DROP POLICY IF EXISTS "Anyone can view tag assignments" ON product_tag_assignments;
DROP POLICY IF EXISTS "Sellers can manage their tag assignments" ON product_tag_assignments;

-- RLS Policies for product_variants
CREATE POLICY "Anyone can view active variants"
  ON product_variants FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Sellers can manage their product variants"
  ON product_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN business_accounts ba ON p.seller_id = ba.id
      WHERE p.id = product_variants.product_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for product_options
CREATE POLICY "Anyone can view product options"
  ON product_options FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage their product options"
  ON product_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN business_accounts ba ON p.seller_id = ba.id
      WHERE p.id = product_options.product_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for inventory_alerts
CREATE POLICY "Sellers can manage their inventory alerts"
  ON inventory_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = inventory_alerts.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for product_preorders
CREATE POLICY "Anyone can view preorder settings"
  ON product_preorders FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage their preorder settings"
  ON product_preorders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN business_accounts ba ON p.seller_id = ba.id
      WHERE p.id = product_preorders.product_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for product_tags
CREATE POLICY "Anyone can view tags"
  ON product_tags FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage their tags"
  ON product_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = product_tags.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for product_tag_assignments
CREATE POLICY "Anyone can view tag assignments"
  ON product_tag_assignments FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage their tag assignments"
  ON product_tag_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN business_accounts ba ON p.seller_id = ba.id
      WHERE p.id = product_tag_assignments.product_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- Function to check low stock and create alerts
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if stock is below threshold for variants
  IF NEW.stock_quantity <= 10 AND NEW.stock_quantity > 0 THEN
    INSERT INTO inventory_alerts (boutique_id, variant_id, alert_type, threshold)
    SELECT b.id, NEW.id, 'low_stock', 10
    FROM products p
    JOIN business_accounts ba ON p.seller_id = ba.id
    JOIN boutiques b ON b.business_account_id = ba.id
    WHERE p.id = NEW.product_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check if out of stock
  IF NEW.stock_quantity = 0 THEN
    INSERT INTO inventory_alerts (boutique_id, variant_id, alert_type)
    SELECT b.id, NEW.id, 'out_of_stock'
    FROM products p
    JOIN business_accounts ba ON p.seller_id = ba.id
    JOIN boutiques b ON b.business_account_id = ba.id
    WHERE p.id = NEW.product_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for stock changes
DROP TRIGGER IF EXISTS on_variant_stock_change ON product_variants;
CREATE TRIGGER on_variant_stock_change
  AFTER UPDATE OF stock_quantity ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock();
