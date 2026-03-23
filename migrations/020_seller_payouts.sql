-- ============================================================================
-- Migration 020: Extend existing seller_payouts table
-- Adds columns needed for admin payout management
-- Original table from 20251202_boutique_system.sql uses business_account_id
-- ============================================================================

-- Add missing columns to the existing seller_payouts table
ALTER TABLE seller_payouts ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT '';
ALTER TABLE seller_payouts ADD COLUMN IF NOT EXISTS commission DECIMAL(12,2) DEFAULT 0;
ALTER TABLE seller_payouts ADD COLUMN IF NOT EXISTS processed_by TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seller_payouts_created ON seller_payouts(created_at DESC);
