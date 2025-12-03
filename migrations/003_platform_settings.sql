-- Platform Settings Table
-- Stores all platform-wide configuration that admin can manage

-- Create the platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'boutique', 'payments', 'notifications', 'appearance', 'seo')),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write platform settings
CREATE POLICY "Admins can manage platform settings"
  ON platform_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'APP_OWNER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'APP_OWNER_ADMIN'
    )
  );

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role can manage platform settings"
  ON platform_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insert default boutique settings
INSERT INTO platform_settings (key, value, category, description)
VALUES (
  'boutique_system',
  '{
    "enabled": true,
    "allowNewSellers": true,
    "requireApproval": true,
    "requireVerification": true,
    "defaultCommissionRate": 10,
    "minCommissionRate": 0,
    "maxCommissionRate": 30,
    "tiers": {
      "free": {
        "enabled": true,
        "name": "Starter",
        "monthlyPrice": 0,
        "annualPrice": 0,
        "commissionRate": 15,
        "maxProducts": 10,
        "maxMonthlyOrders": 50,
        "featuredListings": 0,
        "customBoutique": false,
        "prioritySupport": false,
        "analyticsAdvanced": false,
        "promotionalTools": false,
        "verifiedBadge": false
      },
      "pro": {
        "enabled": true,
        "name": "Professional",
        "monthlyPrice": 29.99,
        "annualPrice": 299.99,
        "commissionRate": 10,
        "maxProducts": 100,
        "maxMonthlyOrders": 500,
        "featuredListings": 5,
        "customBoutique": true,
        "prioritySupport": true,
        "analyticsAdvanced": true,
        "promotionalTools": true,
        "verifiedBadge": false
      },
      "enterprise": {
        "enabled": true,
        "name": "Enterprise",
        "monthlyPrice": 99.99,
        "annualPrice": 999.99,
        "commissionRate": 5,
        "maxProducts": -1,
        "maxMonthlyOrders": -1,
        "featuredListings": 20,
        "customBoutique": true,
        "prioritySupport": true,
        "analyticsAdvanced": true,
        "promotionalTools": true,
        "verifiedBadge": true
      }
    },
    "features": {
      "customBoutiques": true,
      "sellerAnalytics": true,
      "promotionalTools": true,
      "sellerMessaging": false,
      "sellerReviews": true,
      "automaticPayouts": false
    },
    "payouts": {
      "minimumPayout": 50,
      "payoutSchedule": "weekly",
      "payoutMethods": ["bank_transfer", "wave_money"],
      "holdPeriodDays": 7
    },
    "content": {
      "boutiquePageTitle": "Discover Boutiques",
      "boutiquePageDescription": "Shop from our curated collection of unique boutiques",
      "sellerSignupTitle": "Start Your Own Boutique",
      "sellerSignupDescription": "Join our marketplace and showcase your products to thousands of customers",
      "termsAndConditionsUrl": "/terms",
      "sellerAgreementUrl": "/seller-agreement"
    }
  }'::jsonb,
  'boutique',
  'Boutique marketplace system configuration'
)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT ALL ON platform_settings TO authenticated;
GRANT ALL ON platform_settings TO service_role;
