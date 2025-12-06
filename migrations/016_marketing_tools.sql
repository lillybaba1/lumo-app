-- Migration: Marketing Tools
-- Description: Email subscribers, newsletters, referral program, social sharing

-- Email subscribers
CREATE TABLE IF NOT EXISTS boutique_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'signup' CHECK (source IN ('signup', 'checkout', 'popup', 'import', 'referral')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id, email)
);

-- Email campaigns/newsletters
CREATE TABLE IF NOT EXISTS boutique_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  content TEXT NOT NULL, -- HTML content
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  send_to TEXT DEFAULT 'all' CHECK (send_to IN ('all', 'segment', 'followers')),
  segment_filter JSONB, -- filter criteria for segment
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "unsubscribed": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral program
CREATE TABLE IF NOT EXISTS boutique_referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Refer a Friend',
  is_active BOOLEAN DEFAULT FALSE,
  
  -- Referrer rewards
  referrer_reward_type TEXT DEFAULT 'percentage' CHECK (referrer_reward_type IN ('percentage', 'fixed', 'credit')),
  referrer_reward_amount DECIMAL(10,2) DEFAULT 10,
  referrer_min_purchase DECIMAL(10,2) DEFAULT 0,
  
  -- Referee rewards
  referee_reward_type TEXT DEFAULT 'percentage' CHECK (referee_reward_type IN ('percentage', 'fixed')),
  referee_reward_amount DECIMAL(10,2) DEFAULT 10,
  referee_min_purchase DECIMAL(10,2) DEFAULT 0,
  
  -- Limits
  max_referrals_per_user INT DEFAULT 10,
  reward_expires_days INT DEFAULT 30,
  
  -- Terms
  terms_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id)
);

-- Referral codes
CREATE TABLE IF NOT EXISTS boutique_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES boutique_referral_programs(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  uses INT DEFAULT 0,
  max_uses INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral conversions
CREATE TABLE IF NOT EXISTS boutique_referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES boutique_referral_codes(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  referrer_reward_amount DECIMAL(10,2),
  referrer_reward_status TEXT DEFAULT 'pending' CHECK (referrer_reward_status IN ('pending', 'approved', 'paid', 'cancelled')),
  referee_discount_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social sharing settings
CREATE TABLE IF NOT EXISTS boutique_social_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  
  -- Enable/disable platforms
  enable_facebook BOOLEAN DEFAULT TRUE,
  enable_twitter BOOLEAN DEFAULT TRUE,
  enable_pinterest BOOLEAN DEFAULT TRUE,
  enable_whatsapp BOOLEAN DEFAULT TRUE,
  enable_email BOOLEAN DEFAULT TRUE,
  enable_copy_link BOOLEAN DEFAULT TRUE,
  
  -- Share incentives
  share_incentive_enabled BOOLEAN DEFAULT FALSE,
  share_incentive_type TEXT DEFAULT 'discount' CHECK (share_incentive_type IN ('discount', 'credit', 'entry')),
  share_incentive_amount DECIMAL(10,2) DEFAULT 5,
  
  -- Default share text templates
  product_share_text TEXT DEFAULT 'Check out {product_name} from {boutique_name}!',
  collection_share_text TEXT DEFAULT 'Explore {collection_name} at {boutique_name}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id)
);

-- Marketing automations
CREATE TABLE IF NOT EXISTS boutique_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'welcome', 'abandoned_cart', 'post_purchase', 'review_request', 
    'win_back', 'birthday', 'anniversary', 'low_stock_notify'
  )),
  is_active BOOLEAN DEFAULT FALSE,
  delay_hours INT DEFAULT 0, -- hours after trigger
  email_subject TEXT,
  email_content TEXT,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_boutique ON boutique_subscribers(boutique_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON boutique_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON boutique_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_boutique ON boutique_campaigns(boutique_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON boutique_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON boutique_referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referrer ON boutique_referral_codes(referrer_id);
CREATE INDEX IF NOT EXISTS idx_conversions_code ON boutique_referral_conversions(referral_code_id);

-- Enable RLS
ALTER TABLE boutique_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_social_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_automations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (in case they exist from previous migrations)
DROP POLICY IF EXISTS "Sellers can manage their subscribers" ON boutique_subscribers;
DROP POLICY IF EXISTS "Sellers can manage their campaigns" ON boutique_campaigns;
DROP POLICY IF EXISTS "Anyone can view active programs" ON boutique_referral_programs;
DROP POLICY IF EXISTS "Sellers can manage their programs" ON boutique_referral_programs;
DROP POLICY IF EXISTS "Users can view their own codes" ON boutique_referral_codes;
DROP POLICY IF EXISTS "Users can create their own codes" ON boutique_referral_codes;
DROP POLICY IF EXISTS "Users can view their own conversions" ON boutique_referral_conversions;
DROP POLICY IF EXISTS "Anyone can view sharing settings" ON boutique_social_sharing;
DROP POLICY IF EXISTS "Sellers can manage their sharing settings" ON boutique_social_sharing;
DROP POLICY IF EXISTS "Sellers can manage their automations" ON boutique_automations;

-- RLS Policies

-- boutique_subscribers
CREATE POLICY "Sellers can manage their subscribers"
  ON boutique_subscribers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_subscribers.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_campaigns
CREATE POLICY "Sellers can manage their campaigns"
  ON boutique_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_campaigns.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_referral_programs
CREATE POLICY "Anyone can view active programs"
  ON boutique_referral_programs FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Sellers can manage their programs"
  ON boutique_referral_programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_referral_programs.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_referral_codes
CREATE POLICY "Users can view their own codes"
  ON boutique_referral_codes FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR is_active = TRUE);

CREATE POLICY "Users can create their own codes"
  ON boutique_referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = auth.uid());

-- boutique_referral_conversions
CREATE POLICY "Users can view their own conversions"
  ON boutique_referral_conversions FOR SELECT
  TO authenticated
  USING (
    referee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM boutique_referral_codes c
      WHERE c.id = boutique_referral_conversions.referral_code_id
      AND c.referrer_id = auth.uid()
    )
  );

-- boutique_social_sharing
CREATE POLICY "Anyone can view sharing settings"
  ON boutique_social_sharing FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage their sharing settings"
  ON boutique_social_sharing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_social_sharing.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_automations
CREATE POLICY "Sellers can manage their automations"
  ON boutique_automations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_automations.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );
