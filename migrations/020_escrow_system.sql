-- ============================================================================
-- Migration 020: Escrow System
-- Adds delivery confirmation tokens and escrow tracking to orders
-- ============================================================================

-- Add escrow columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmation_token UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payout_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_confirm_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seller_id UUID DEFAULT NULL;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_token
  ON public.orders (confirmation_token)
  WHERE confirmation_token IS NOT NULL;

-- Index for auto-confirm cron job
CREATE INDEX IF NOT EXISTS idx_orders_auto_confirm
  ON public.orders (auto_confirm_at)
  WHERE auto_confirm_at IS NOT NULL AND status = 'Shipped';

-- Index for seller order lookups
CREATE INDEX IF NOT EXISTS idx_orders_seller_id
  ON public.orders (seller_id)
  WHERE seller_id IS NOT NULL;

-- Delivery confirmations table for tracking confirmation events
CREATE TABLE IF NOT EXISTS public.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  buyer_phone TEXT,
  buyer_email TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ DEFAULT NULL,
  confirmed_ip TEXT DEFAULT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_token
  ON public.delivery_confirmations (token);

-- Index on order_id
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_order_id
  ON public.delivery_confirmations (order_id);

-- RLS for delivery_confirmations
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role manages delivery confirmations"
  ON public.delivery_confirmations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anyone can read confirmations (needed for public confirmation page)
CREATE POLICY "Anyone can read delivery confirmations"
  ON public.delivery_confirmations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON public.delivery_confirmations TO service_role;
GRANT SELECT ON public.delivery_confirmations TO authenticated;
GRANT SELECT ON public.delivery_confirmations TO anon;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_delivery_confirmations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_delivery_confirmations_updated_at ON public.delivery_confirmations;
CREATE TRIGGER update_delivery_confirmations_updated_at
  BEFORE UPDATE ON public.delivery_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_confirmations_updated_at();
