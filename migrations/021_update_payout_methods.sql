-- ============================================================================
-- Migration 021: Update payout system for Modem Pay integration
-- - Expand payout_method CHECK to include mobile money providers
-- - Change default currency to GMD
-- - Add transfer_id column for Modem Pay transfer tracking
-- ============================================================================

-- Drop the old CHECK constraint and add expanded one
ALTER TABLE seller_payouts DROP CONSTRAINT IF EXISTS seller_payouts_payout_method_check;
ALTER TABLE seller_payouts ADD CONSTRAINT seller_payouts_payout_method_check 
  CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe', 'wave', 'qmoney', 'afrimoney', 'mobile_money', 'cash', 'manual'));

-- Change default currency to GMD
ALTER TABLE seller_payouts ALTER COLUMN currency SET DEFAULT 'GMD';

-- Add transfer_id for Modem Pay transfer tracking
ALTER TABLE seller_payouts ADD COLUMN IF NOT EXISTS transfer_id TEXT;

-- Index for looking up payouts by transfer_id (webhook callbacks)
CREATE INDEX IF NOT EXISTS idx_seller_payouts_transfer_id ON seller_payouts(transfer_id) WHERE transfer_id IS NOT NULL;
