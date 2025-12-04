-- Ensure boutiques table exists (it might be missing from previous migrations)
CREATE TABLE IF NOT EXISTS boutiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo TEXT,
  banner_image TEXT,
  theme_color TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'suspended'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_account_id)
);

-- Add status column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boutiques' AND column_name = 'status') THEN
        ALTER TABLE boutiques ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Add is_published column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boutiques' AND column_name = 'is_published') THEN
        ALTER TABLE boutiques ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_boutiques_business_account ON boutiques(business_account_id);
CREATE INDEX IF NOT EXISTS idx_boutiques_slug ON boutiques(slug);
CREATE INDEX IF NOT EXISTS idx_boutiques_status ON boutiques(status);
CREATE INDEX IF NOT EXISTS idx_boutiques_is_published ON boutiques(is_published);

-- Enable RLS
ALTER TABLE boutiques ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public can view published boutiques
DROP POLICY IF EXISTS "Public can view published boutiques" ON boutiques;
CREATE POLICY "Public can view published boutiques"
  ON boutiques FOR SELECT
  USING (is_published = true AND status = 'active');

-- Owners can view their own boutique
DROP POLICY IF EXISTS "Owners can view their own boutique" ON boutiques;
CREATE POLICY "Owners can view their own boutique"
  ON boutiques FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_accounts 
      WHERE business_accounts.id = boutiques.business_account_id 
      AND business_accounts.owner_user_id = auth.uid()
    )
  );

-- Owners can update their own boutique
DROP POLICY IF EXISTS "Owners can update their own boutique" ON boutiques;
CREATE POLICY "Owners can update their own boutique"
  ON boutiques FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_accounts 
      WHERE business_accounts.id = boutiques.business_account_id 
      AND business_accounts.owner_user_id = auth.uid()
    )
  );

-- Admins can view all boutiques
DROP POLICY IF EXISTS "Admins can view all boutiques" ON boutiques;
CREATE POLICY "Admins can view all boutiques"
  ON boutiques FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'APP_OWNER_ADMIN'
    )
  );

-- Admins can update all boutiques
DROP POLICY IF EXISTS "Admins can update all boutiques" ON boutiques;
CREATE POLICY "Admins can update all boutiques"
  ON boutiques FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'APP_OWNER_ADMIN'
    )
  );
