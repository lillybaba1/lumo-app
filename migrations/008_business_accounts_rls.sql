-- Add RLS policy to allow users to read their own business account
-- This is safe because users can only see their own data (owner_user_id = auth.uid())

-- First, ensure RLS is enabled on business_accounts
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own business account" ON business_accounts;

-- Create policy allowing users to SELECT their own business account
CREATE POLICY "Users can view their own business account"
ON business_accounts
FOR SELECT
TO authenticated
USING (owner_user_id = auth.uid());

-- Note: UPDATE policy is intentionally NOT created here
-- Users should update their business account through API endpoints
-- that use service role, allowing proper validation of:
-- - business_name, contact_person_name, contact_email
-- - business_address, business_phone, website, description
-- - logo, shipping_policies, return_policy
-- 
-- The following fields should NEVER be user-editable:
-- - status, account_approved, boutique_approved (admin only)
-- - owner_user_id (immutable)
-- - subscription_*, stripe_* (managed by payment system)
-- - total_earnings, pending_payout (calculated fields)

-- Note: INSERT and DELETE should remain admin-only for security
-- The signup process uses service role to create business accounts
