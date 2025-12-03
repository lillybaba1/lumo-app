-- Migration: Add multi-phase approval fields to business_accounts
-- This enables the workflow: Email Verified -> Account Approved -> Boutique Setup -> Boutique Approved

-- Add new approval tracking fields
ALTER TABLE business_accounts 
ADD COLUMN IF NOT EXISTS account_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS boutique_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS boutique_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS boutique_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS boutique_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS boutique_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS boutique_rejection_reason TEXT;

-- Add index for faster lookups on approval status
CREATE INDEX IF NOT EXISTS idx_business_accounts_approval_status 
ON business_accounts(account_approved, boutique_approved);

-- Create admin notifications table for boutique submissions
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'new_business_account', 'boutique_submitted', etc.
  title TEXT NOT NULL,
  message TEXT,
  business_account_id UUID REFERENCES business_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread 
ON admin_notifications(is_read, created_at DESC) WHERE is_read = FALSE;

-- RLS for admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view all notifications" ON admin_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'APP_OWNER_ADMIN'
    )
  );

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications" ON admin_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'APP_OWNER_ADMIN'
    )
  );

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON admin_notifications
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE admin_notifications IS 'Notifications for admin dashboard about new accounts and boutique submissions';
COMMENT ON COLUMN business_accounts.account_approved IS 'Whether the business account has been approved by admin';
COMMENT ON COLUMN business_accounts.boutique_submitted IS 'Whether the seller has submitted their boutique data for review';
COMMENT ON COLUMN business_accounts.boutique_approved IS 'Whether the boutique has been approved by admin';
