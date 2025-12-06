-- Seller Promotions & Coupons Schema
-- Run this migration in Supabase SQL Editor

-- Seller Coupons Table
CREATE TABLE IF NOT EXISTS seller_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2), -- Max discount for percentage coupons
  usage_limit INTEGER, -- Total times coupon can be used
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1, -- Times per customer
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'specific')),
  product_ids UUID[], -- Specific products if applies_to = 'specific'
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, code)
);

-- Flash Sales Table
CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5,2) NOT NULL,
  product_ids UUID[] NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bundle Deals Table
CREATE TABLE IF NOT EXISTS bundle_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  product_ids UUID[] NOT NULL,
  bundle_price DECIMAL(10,2) NOT NULL, -- Special price for the bundle
  original_price DECIMAL(10,2) NOT NULL, -- Sum of individual prices
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon Usage Tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES seller_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_coupons_seller ON seller_coupons(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_coupons_code ON seller_coupons(code);
CREATE INDEX IF NOT EXISTS idx_seller_coupons_active ON seller_coupons(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_flash_sales_seller ON flash_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_dates ON flash_sales(starts_at, ends_at, is_active);
CREATE INDEX IF NOT EXISTS idx_bundle_deals_seller ON bundle_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);

-- RLS Policies
ALTER TABLE seller_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (in case they exist from previous migrations)
DROP POLICY IF EXISTS "Sellers can view own coupons" ON seller_coupons;
DROP POLICY IF EXISTS "Sellers can insert own coupons" ON seller_coupons;
DROP POLICY IF EXISTS "Sellers can update own coupons" ON seller_coupons;
DROP POLICY IF EXISTS "Sellers can delete own coupons" ON seller_coupons;
DROP POLICY IF EXISTS "Public can validate coupons" ON seller_coupons;
DROP POLICY IF EXISTS "Sellers can view own flash sales" ON flash_sales;
DROP POLICY IF EXISTS "Sellers can insert own flash sales" ON flash_sales;
DROP POLICY IF EXISTS "Sellers can update own flash sales" ON flash_sales;
DROP POLICY IF EXISTS "Sellers can delete own flash sales" ON flash_sales;
DROP POLICY IF EXISTS "Sellers can view own bundle deals" ON bundle_deals;
DROP POLICY IF EXISTS "Sellers can insert own bundle deals" ON bundle_deals;
DROP POLICY IF EXISTS "Sellers can update own bundle deals" ON bundle_deals;
DROP POLICY IF EXISTS "Sellers can delete own bundle deals" ON bundle_deals;
DROP POLICY IF EXISTS "Users can view own coupon usage" ON coupon_usage;

-- Sellers can manage their own coupons
CREATE POLICY "Sellers can view own coupons" ON seller_coupons
  FOR SELECT USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'APP_OWNER_ADMIN')
  );

CREATE POLICY "Sellers can insert own coupons" ON seller_coupons
  FOR INSERT WITH CHECK (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Sellers can update own coupons" ON seller_coupons
  FOR UPDATE USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Sellers can delete own coupons" ON seller_coupons
  FOR DELETE USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

-- Flash sales policies
CREATE POLICY "Sellers can view own flash sales" ON flash_sales
  FOR SELECT USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'APP_OWNER_ADMIN')
  );

CREATE POLICY "Sellers can insert own flash sales" ON flash_sales
  FOR INSERT WITH CHECK (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Sellers can update own flash sales" ON flash_sales
  FOR UPDATE USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Sellers can delete own flash sales" ON flash_sales
  FOR DELETE USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

-- Bundle deals policies  
CREATE POLICY "Sellers can view own bundle deals" ON bundle_deals
  FOR SELECT USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'APP_OWNER_ADMIN')
  );

CREATE POLICY "Sellers can insert own bundle deals" ON bundle_deals
  FOR INSERT WITH CHECK (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Sellers can update own bundle deals" ON bundle_deals
  FOR UPDATE USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Sellers can delete own bundle deals" ON bundle_deals
  FOR DELETE USING (
    seller_id IN (SELECT id FROM business_accounts WHERE owner_user_id = auth.uid())
  );

-- Coupon usage - users can see their own usage
CREATE POLICY "Users can view own coupon usage" ON coupon_usage
  FOR SELECT USING (user_id = auth.uid());

-- Public can validate coupons (read only active coupons)
CREATE POLICY "Public can validate coupons" ON seller_coupons
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
