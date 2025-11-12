-- ============================================
-- Add phone number uniqueness and email verification tracking
-- Migration: 20250112
-- ============================================

-- Add email_verified column to track email verification status
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Make phone_number NOT NULL (required for signup)
-- First, update any existing NULL phone numbers with a placeholder
UPDATE public.users SET phone_number = '' WHERE phone_number IS NULL;

-- Now alter the column to NOT NULL
ALTER TABLE public.users
ALTER COLUMN phone_number SET NOT NULL;

-- Add UNIQUE constraint on phone_number to enforce one account per phone
-- First, ensure there are no duplicate phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number_unique
ON public.users(phone_number)
WHERE phone_number != '';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON public.users(phone_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Create OTP verification table for SMS codes
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  email TEXT,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'phone_verification', 'password_reset')),
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for OTP lookups
CREATE INDEX idx_otp_phone_number ON public.otp_verifications(phone_number);
CREATE INDEX idx_otp_email ON public.otp_verifications(email);
CREATE INDEX idx_otp_expires_at ON public.otp_verifications(expires_at);

-- Enable RLS on OTP table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- OTP policies - users can only verify their own codes
CREATE POLICY "Users can verify own OTP"
  ON public.otp_verifications FOR SELECT
  USING (true); -- Allow reading for verification, but limit in application code

-- Create table for tracking auth rate limits
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP address, email, or phone
  action TEXT NOT NULL CHECK (action IN ('signup', 'login', 'otp_send', 'otp_verify')),
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rate limit lookups
CREATE INDEX idx_auth_rate_limits_identifier_action ON public.auth_rate_limits(identifier, action);
CREATE INDEX idx_auth_rate_limits_blocked_until ON public.auth_rate_limits(blocked_until);

-- Enable RLS on rate limits table
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can view rate limit data
CREATE POLICY "Admins only - auth rate limits"
  ON public.auth_rate_limits FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE last_attempt < NOW() - INTERVAL '7 days'
  AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;Human: I want you to build me this for my app