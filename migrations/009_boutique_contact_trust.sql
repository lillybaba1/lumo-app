-- Migration: Add boutique-specific contact, location, and trust-building fields
-- These are separate from the seller's personal business account info

-- Add new columns to boutiques table
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS store_address TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS store_city TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS store_country TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS store_location TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS business_hours TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS established_year TEXT;
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS trust_badges TEXT[] DEFAULT '{}';
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT '{}';
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS accepted_payments TEXT[] DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN boutiques.whatsapp IS 'WhatsApp number for customer contact';
COMMENT ON COLUMN boutiques.store_address IS 'Physical store address (if applicable)';
COMMENT ON COLUMN boutiques.store_city IS 'City where the store is located';
COMMENT ON COLUMN boutiques.store_country IS 'Country where the store is located';
COMMENT ON COLUMN boutiques.store_location IS 'Location description with landmarks';
COMMENT ON COLUMN boutiques.business_hours IS 'Business operating hours';
COMMENT ON COLUMN boutiques.established_year IS 'Year the business was established';
COMMENT ON COLUMN boutiques.trust_badges IS 'Array of trust badges like Fast Shipping, Money Back Guarantee';
COMMENT ON COLUMN boutiques.specializations IS 'Array of product categories the seller specializes in';
COMMENT ON COLUMN boutiques.accepted_payments IS 'Array of accepted payment methods';
