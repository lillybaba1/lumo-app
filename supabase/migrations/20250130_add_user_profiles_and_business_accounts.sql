-- ============================================
-- User Profiles Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'PERSONAL_ACCOUNT' CHECK (role IN ('APP_OWNER_ADMIN', 'BUSINESS_ACCOUNT', 'PERSONAL_ACCOUNT')),
    business_account_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'APP_OWNER_ADMIN'
        )
    );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Service role can insert profiles (for signup)
CREATE POLICY "Service role can insert profiles"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Business Accounts Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    business_name TEXT NOT NULL,
    contact_person_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    business_address TEXT NOT NULL,
    business_phone TEXT,
    tax_id TEXT,
    website TEXT,
    description TEXT,
    logo TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION')),
    payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe') OR payout_method IS NULL),
    payout_details JSONB,
    shipping_policies TEXT,
    return_policy TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_accounts_owner ON public.business_accounts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_business_accounts_status ON public.business_accounts(status);

-- Enable Row Level Security
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can read their own account
CREATE POLICY "Business owners can read own account"
    ON public.business_accounts
    FOR SELECT
    USING (auth.uid() = owner_user_id);

-- Policy: Admins can read all business accounts
CREATE POLICY "Admins can read all business accounts"
    ON public.business_accounts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'APP_OWNER_ADMIN'
        )
    );

-- Policy: Business owners can update their own account
CREATE POLICY "Business owners can update own account"
    ON public.business_accounts
    FOR UPDATE
    USING (auth.uid() = owner_user_id);

-- Policy: Service role can insert business accounts (for signup)
CREATE POLICY "Service role can insert business accounts"
    ON public.business_accounts
    FOR INSERT
    WITH CHECK (true);

-- Add foreign key from user_profiles to business_accounts
ALTER TABLE public.user_profiles
    ADD CONSTRAINT fk_user_profiles_business_account
    FOREIGN KEY (business_account_id)
    REFERENCES public.business_accounts(id)
    ON DELETE SET NULL;

-- ============================================
-- Grant permissions to service role
-- ============================================
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.business_accounts TO service_role;
