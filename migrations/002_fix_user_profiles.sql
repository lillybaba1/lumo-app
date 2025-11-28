-- Fix: Add business_account_id to user_profiles table
-- This was missing from the initial migration

-- Add business_account_id column (for BUSINESS_ACCOUNT users)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS business_account_id UUID REFERENCES business_accounts(id) ON DELETE SET NULL;

-- Create index on business_account_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_account ON user_profiles(business_account_id);
