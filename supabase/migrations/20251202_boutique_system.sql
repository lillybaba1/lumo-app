-- Migration: Boutique System for Sellers
-- Adds subscription tiers, seller types, verification, and boutique storefronts

-- 1. Add new columns to business_accounts
ALTER TABLE public.business_accounts 
  ADD COLUMN IF NOT EXISTS seller_type TEXT DEFAULT 'individual' CHECK (seller_type IN ('individual', 'company')),
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS boutique_id UUID,
  ADD COLUMN IF NOT EXISTS boutique_slug TEXT,
  ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_commission_paid DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_payout DECIMAL(12, 2) DEFAULT 0;

-- 2. Create boutiques table
CREATE TABLE IF NOT EXISTS public.boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo TEXT,
  banner_image TEXT,
  theme_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#ec4899',
  social_links JSONB DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  shipping_info TEXT,
  return_policy TEXT,
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create seller_subscriptions table for subscription history
CREATE TABLE IF NOT EXISTS public.seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'expired')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')),
  amount DECIMAL(10, 2),
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create seller_transactions table for commission tracking
CREATE TABLE IF NOT EXISTS public.seller_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  order_item_id UUID,
  type TEXT NOT NULL CHECK (type IN ('sale', 'commission', 'payout', 'refund', 'adjustment', 'subscription_fee')),
  amount DECIMAL(12, 2) NOT NULL,
  commission_rate DECIMAL(5, 2), -- Commission percentage at time of transaction
  commission_amount DECIMAL(12, 2),
  net_amount DECIMAL(12, 2), -- Amount after commission
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  payout_id UUID, -- Reference to payout batch if applicable
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create seller_payouts table
CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe')),
  payout_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create seller_verification_requests table
CREATE TABLE IF NOT EXISTS public.seller_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  seller_type TEXT NOT NULL CHECK (seller_type IN ('individual', 'company')),
  -- Individual verification
  id_document_url TEXT,
  id_document_type TEXT CHECK (id_document_type IN ('passport', 'drivers_license', 'national_id')),
  -- Company verification
  business_license_url TEXT,
  certificate_of_incorporation_url TEXT,
  proof_of_address_url TEXT,
  -- Review
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_boutiques_slug ON public.boutiques(slug);
CREATE INDEX IF NOT EXISTS idx_boutiques_business_account ON public.boutiques(business_account_id);
CREATE INDEX IF NOT EXISTS idx_boutiques_featured ON public.boutiques(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_seller_transactions_business ON public.seller_transactions(business_account_id);
CREATE INDEX IF NOT EXISTS idx_seller_transactions_order ON public.seller_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_business ON public.seller_payouts(business_account_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON public.seller_payouts(status);
CREATE INDEX IF NOT EXISTS idx_business_accounts_subscription ON public.business_accounts(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_business_accounts_verification ON public.business_accounts(verification_status);

-- 8. Create trigger for boutiques updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_boutiques_updated_at ON public.boutiques;
CREATE TRIGGER update_boutiques_updated_at 
  BEFORE UPDATE ON public.boutiques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS Policies for boutiques
ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;

-- Anyone can view published boutiques
CREATE POLICY "Anyone can view published boutiques"
  ON public.boutiques FOR SELECT
  USING (is_published = true);

-- Business owners can manage their own boutique
CREATE POLICY "Business owners can manage their boutique"
  ON public.boutiques FOR ALL
  USING (
    business_account_id IN (
      SELECT id FROM public.business_accounts 
      WHERE owner_user_id = auth.uid()
    )
  );

-- Admins can manage all boutiques
CREATE POLICY "Admins can manage all boutiques"
  ON public.boutiques FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'APP_OWNER_ADMIN')
    )
  );

-- 10. RLS for seller_transactions
ALTER TABLE public.seller_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own transactions"
  ON public.seller_transactions FOR SELECT
  USING (
    business_account_id IN (
      SELECT id FROM public.business_accounts 
      WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all transactions"
  ON public.seller_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'APP_OWNER_ADMIN')
    )
  );

-- 11. RLS for seller_payouts
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own payouts"
  ON public.seller_payouts FOR SELECT
  USING (
    business_account_id IN (
      SELECT id FROM public.business_accounts 
      WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payouts"
  ON public.seller_payouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'APP_OWNER_ADMIN')
    )
  );

-- 12. RLS for seller_verification_requests
ALTER TABLE public.seller_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own verification requests"
  ON public.seller_verification_requests FOR SELECT
  USING (
    business_account_id IN (
      SELECT id FROM public.business_accounts 
      WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can insert their own verification requests"
  ON public.seller_verification_requests FOR INSERT
  WITH CHECK (
    business_account_id IN (
      SELECT id FROM public.business_accounts 
      WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all verification requests"
  ON public.seller_verification_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'APP_OWNER_ADMIN')
    )
  );

-- 13. Grant permissions
GRANT ALL ON public.boutiques TO authenticated;
GRANT ALL ON public.boutiques TO service_role;
GRANT ALL ON public.seller_subscriptions TO authenticated;
GRANT ALL ON public.seller_subscriptions TO service_role;
GRANT ALL ON public.seller_transactions TO authenticated;
GRANT ALL ON public.seller_transactions TO service_role;
GRANT ALL ON public.seller_payouts TO authenticated;
GRANT ALL ON public.seller_payouts TO service_role;
GRANT ALL ON public.seller_verification_requests TO authenticated;
GRANT ALL ON public.seller_verification_requests TO service_role;

-- 14. Function to generate unique boutique slug
CREATE OR REPLACE FUNCTION generate_boutique_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
  final_slug TEXT;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  slug := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  slug := trim(both '-' from slug);
  
  final_slug := slug;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.boutiques WHERE boutiques.slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 15. Function to calculate commission for an order
CREATE OR REPLACE FUNCTION calculate_seller_commission(
  p_business_account_id UUID,
  p_sale_amount DECIMAL
)
RETURNS TABLE (
  commission_rate DECIMAL,
  commission_amount DECIMAL,
  net_amount DECIMAL
) AS $$
DECLARE
  v_tier TEXT;
  v_rate DECIMAL;
BEGIN
  -- Get seller's subscription tier
  SELECT subscription_tier INTO v_tier
  FROM public.business_accounts
  WHERE id = p_business_account_id;
  
  -- Determine commission rate based on tier
  v_rate := CASE v_tier
    WHEN 'enterprise' THEN 5.0
    WHEN 'pro' THEN 10.0
    ELSE 15.0 -- free tier
  END;
  
  RETURN QUERY SELECT 
    v_rate AS commission_rate,
    ROUND(p_sale_amount * v_rate / 100, 2) AS commission_amount,
    ROUND(p_sale_amount - (p_sale_amount * v_rate / 100), 2) AS net_amount;
END;
$$ LANGUAGE plpgsql;
