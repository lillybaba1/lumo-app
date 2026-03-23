-- ============================================================================
-- Migration 020: Seller Payouts Table
-- Tracks all payouts made from the platform to sellers
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  payout_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes TEXT,
  processed_by TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_created ON seller_payouts(created_at DESC);

-- RLS policies
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;

-- Admin can read all payouts
CREATE POLICY "Admins can read all payouts"
  ON seller_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'APP_OWNER_ADMIN')
    )
  );

-- Admin can insert payouts
CREATE POLICY "Admins can insert payouts"
  ON seller_payouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'APP_OWNER_ADMIN')
    )
  );

-- Admin can update payouts
CREATE POLICY "Admins can update payouts"
  ON seller_payouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'APP_OWNER_ADMIN')
    )
  );

-- Sellers can read their own payouts
CREATE POLICY "Sellers can read own payouts"
  ON seller_payouts FOR SELECT
  USING (
    seller_id IN (
      SELECT id FROM business_accounts 
      WHERE owner_user_id = auth.uid()
    )
  );
