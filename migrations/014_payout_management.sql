-- Migration: Payout Management System
-- Description: Seller payouts, commissions, and earnings tracking

-- Seller payout accounts (bank/payment info)
CREATE TABLE IF NOT EXISTS seller_payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'paypal', 'stripe')),
  account_name TEXT NOT NULL,
  account_details JSONB NOT NULL, -- encrypted bank details, email, etc.
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller payouts (create BEFORE seller_earnings to avoid forward reference)
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  payout_account_id UUID REFERENCES seller_payout_accounts(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('bank', 'paypal', 'stripe', 'manual')),
  transaction_id TEXT, -- external payment reference
  failure_reason TEXT,
  notes TEXT,
  scheduled_date DATE,
  processed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller earnings (per order)
CREATE TABLE IF NOT EXISTS seller_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_total DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 10,
  payment_processing_fee DECIMAL(10,2) DEFAULT 0,
  net_earnings DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'processing', 'paid', 'refunded')),
  available_date TIMESTAMPTZ, -- when funds become available
  payout_id UUID REFERENCES seller_payouts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout schedule configuration
CREATE TABLE IF NOT EXISTS seller_payout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  payout_frequency TEXT DEFAULT 'weekly' CHECK (payout_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'manual')),
  payout_day INT, -- day of week (0-6) or day of month (1-28)
  minimum_payout DECIMAL(10,2) DEFAULT 25.00,
  hold_period_days INT DEFAULT 7, -- days to hold before funds available
  auto_payout BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id)
);

-- Commission tiers (for volume-based discounts)
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_monthly_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_monthly_sales DECIMAL(10,2),
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller balance tracking (cached for performance)
CREATE TABLE IF NOT EXISTS seller_balances (
  boutique_id UUID PRIMARY KEY REFERENCES boutiques(id) ON DELETE CASCADE,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  total_fees DECIMAL(10,2) DEFAULT 0,
  last_payout_date TIMESTAMPTZ,
  next_payout_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payout_accounts_boutique ON seller_payout_accounts(boutique_id);
CREATE INDEX IF NOT EXISTS idx_earnings_boutique ON seller_earnings(boutique_id);
CREATE INDEX IF NOT EXISTS idx_earnings_order ON seller_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_payouts_boutique ON seller_payouts(boutique_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON seller_payouts(status);

-- Enable RLS
ALTER TABLE seller_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payout_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_payout_accounts
CREATE POLICY "Sellers can manage their payout accounts"
  ON seller_payout_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_payout_accounts.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for seller_earnings
CREATE POLICY "Sellers can view their earnings"
  ON seller_earnings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_earnings.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for seller_payouts
CREATE POLICY "Sellers can view their payouts"
  ON seller_payouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_payouts.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can request payouts"
  ON seller_payouts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_payouts.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for seller_payout_settings
CREATE POLICY "Sellers can manage their payout settings"
  ON seller_payout_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_payout_settings.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for commission_tiers
CREATE POLICY "Anyone can view commission tiers"
  ON commission_tiers FOR SELECT
  USING (is_active = TRUE);

-- RLS Policies for seller_balances
CREATE POLICY "Sellers can view their balance"
  ON seller_balances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_balances.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- Function to update balance after earnings change
CREATE OR REPLACE FUNCTION update_seller_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO seller_balances (boutique_id)
  VALUES (COALESCE(NEW.boutique_id, OLD.boutique_id))
  ON CONFLICT (boutique_id) DO NOTHING;

  UPDATE seller_balances
  SET
    pending_balance = (
      SELECT COALESCE(SUM(net_earnings), 0)
      FROM seller_earnings
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'pending'
    ),
    available_balance = (
      SELECT COALESCE(SUM(net_earnings), 0)
      FROM seller_earnings
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'available'
    ),
    total_earnings = (
      SELECT COALESCE(SUM(net_earnings), 0)
      FROM seller_earnings
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status NOT IN ('refunded')
    ),
    total_paid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM seller_payouts
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'completed'
    ),
    total_fees = (
      SELECT COALESCE(SUM(platform_fee + COALESCE(payment_processing_fee, 0)), 0)
      FROM seller_earnings
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
    ),
    updated_at = NOW()
  WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS on_earnings_change ON seller_earnings;
CREATE TRIGGER on_earnings_change
  AFTER INSERT OR UPDATE OR DELETE ON seller_earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_balance();

-- Insert default commission tiers
INSERT INTO commission_tiers (name, min_monthly_sales, max_monthly_sales, commission_percentage) VALUES
  ('Starter', 0, 1000, 12),
  ('Growing', 1000.01, 5000, 10),
  ('Established', 5000.01, 25000, 8),
  ('Power Seller', 25000.01, NULL, 6)
ON CONFLICT DO NOTHING;
