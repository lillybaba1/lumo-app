-- Migration: Add notification preference to boutique followers
-- Allows users to choose whether to receive notifications for boutiques they follow

-- Add notifications_enabled column to boutique_followers
ALTER TABLE public.boutique_followers 
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.boutique_followers.notifications_enabled IS 'Whether user wants notifications for this boutique (new products, sales, etc.)';
