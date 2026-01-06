-- IP Bans and Investigation System
-- Tracks banned IPs and VPN detection

-- Table for banned IPs
CREATE TABLE IF NOT EXISTS public.ip_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL, -- Supports IPv6
  ip_range VARCHAR(50), -- For range bans like 192.168.1.0/24
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent
  is_active BOOLEAN DEFAULT TRUE,
  ban_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'auto', 'temporary'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for IP investigation logs
CREATE TABLE IF NOT EXISTS public.ip_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL,
  investigated_by UUID REFERENCES auth.users(id),
  investigation_data JSONB, -- Full IP details from lookup
  is_vpn BOOLEAN DEFAULT FALSE,
  is_proxy BOOLEAN DEFAULT FALSE,
  is_tor BOOLEAN DEFAULT FALSE,
  is_datacenter BOOLEAN DEFAULT FALSE,
  threat_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  real_ip VARCHAR(45), -- If detected behind VPN
  real_location JSONB, -- If detected behind VPN
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for suspicious activity logs
CREATE TABLE IF NOT EXISTS public.suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL,
  visitor_id VARCHAR(100),
  activity_type VARCHAR(50) NOT NULL, -- 'vpn_detected', 'multiple_accounts', 'rate_limit', 'brute_force', 'suspicious_pattern'
  description TEXT,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_bans_ip ON public.ip_bans(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_bans_active ON public.ip_bans(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ip_investigations_ip ON public.ip_investigations(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_investigations_vpn ON public.ip_investigations(is_vpn) WHERE is_vpn = TRUE;
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip ON public.suspicious_activities(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_unresolved ON public.suspicious_activities(is_resolved) WHERE is_resolved = FALSE;

-- RLS Policies (Admin only)
ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin full access to ip_bans" ON public.ip_bans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('APP_OWNER_ADMIN'))
  );

CREATE POLICY "Admin full access to ip_investigations" ON public.ip_investigations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('APP_OWNER_ADMIN'))
  );

CREATE POLICY "Admin full access to suspicious_activities" ON public.suspicious_activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('APP_OWNER_ADMIN'))
  );

-- Function to check if IP is banned
CREATE OR REPLACE FUNCTION is_ip_banned(check_ip VARCHAR(45))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.ip_bans 
    WHERE ip_address = check_ip 
    AND is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ip_bans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ip_bans_timestamp
  BEFORE UPDATE ON public.ip_bans
  FOR EACH ROW
  EXECUTE FUNCTION update_ip_bans_updated_at();

-- =====================================================
-- USER-IP TRACKING SYSTEM
-- Links user accounts to IP addresses for security monitoring
-- =====================================================

-- Table for tracking user-IP associations (login history)
CREATE TABLE IF NOT EXISTS public.user_ip_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  device_fingerprint VARCHAR(100),
  login_type VARCHAR(30) DEFAULT 'password', -- 'password', 'magic_link', 'oauth', 'phone', '2fa'
  is_vpn BOOLEAN DEFAULT FALSE,
  is_proxy BOOLEAN DEFAULT FALSE,
  threat_level VARCHAR(20) DEFAULT 'low',
  country VARCHAR(100),
  city VARCHAR(100),
  session_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking known user devices/IPs (trusted vs suspicious)
CREATE TABLE IF NOT EXISTS public.user_known_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,
  is_trusted BOOLEAN DEFAULT FALSE, -- User can mark IPs as trusted
  is_blocked BOOLEAN DEFAULT FALSE, -- Block specific IP for this user
  device_info JSONB,
  location_info JSONB,
  notes TEXT,
  UNIQUE(user_id, ip_address)
);

-- Table for email-based security flags
CREATE TABLE IF NOT EXISTS public.user_security_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  flagged_by UUID REFERENCES auth.users(id),
  flagged_at TIMESTAMP WITH TIME ZONE,
  unique_ips_count INTEGER DEFAULT 0,
  unique_countries_count INTEGER DEFAULT 0,
  vpn_login_count INTEGER DEFAULT 0,
  last_login_ip VARCHAR(45),
  last_login_at TIMESTAMP WITH TIME ZONE,
  suspicious_pattern_detected BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user-IP tracking
CREATE INDEX IF NOT EXISTS idx_user_ip_history_user ON public.user_ip_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_history_email ON public.user_ip_history(email);
CREATE INDEX IF NOT EXISTS idx_user_ip_history_ip ON public.user_ip_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_ip_history_created ON public.user_ip_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_known_ips_user ON public.user_known_ips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_known_ips_ip ON public.user_known_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_security_flags_email ON public.user_security_flags(email);
CREATE INDEX IF NOT EXISTS idx_user_security_flags_flagged ON public.user_security_flags(is_flagged) WHERE is_flagged = TRUE;

-- RLS for new tables
ALTER TABLE public.user_ip_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_known_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_flags ENABLE ROW LEVEL SECURITY;

-- Admin-only access to user-IP tracking
CREATE POLICY "Admin full access to user_ip_history" ON public.user_ip_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('APP_OWNER_ADMIN'))
  );

CREATE POLICY "Admin full access to user_known_ips" ON public.user_known_ips
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('APP_OWNER_ADMIN'))
  );

-- Users can see their own known IPs
CREATE POLICY "Users can view own known IPs" ON public.user_known_ips
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin full access to user_security_flags" ON public.user_security_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('APP_OWNER_ADMIN'))
  );

-- Function to record a user login with IP
CREATE OR REPLACE FUNCTION record_user_login(
  p_user_id UUID,
  p_email VARCHAR(255),
  p_ip_address VARCHAR(45),
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint VARCHAR(100) DEFAULT NULL,
  p_login_type VARCHAR(30) DEFAULT 'password',
  p_is_vpn BOOLEAN DEFAULT FALSE,
  p_is_proxy BOOLEAN DEFAULT FALSE,
  p_threat_level VARCHAR(20) DEFAULT 'low',
  p_country VARCHAR(100) DEFAULT NULL,
  p_city VARCHAR(100) DEFAULT NULL,
  p_session_id VARCHAR(100) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Insert into login history
  INSERT INTO public.user_ip_history (
    user_id, email, ip_address, user_agent, device_fingerprint,
    login_type, is_vpn, is_proxy, threat_level, country, city, session_id
  ) VALUES (
    p_user_id, p_email, p_ip_address, p_user_agent, p_device_fingerprint,
    p_login_type, p_is_vpn, p_is_proxy, p_threat_level, p_country, p_city, p_session_id
  );
  
  -- Upsert into known IPs
  INSERT INTO public.user_known_ips (user_id, email, ip_address, location_info)
  VALUES (
    p_user_id, 
    p_email, 
    p_ip_address,
    jsonb_build_object('country', p_country, 'city', p_city)
  )
  ON CONFLICT (user_id, ip_address) 
  DO UPDATE SET 
    last_seen_at = NOW(),
    login_count = user_known_ips.login_count + 1,
    location_info = COALESCE(jsonb_build_object('country', p_country, 'city', p_city), user_known_ips.location_info);
  
  -- Upsert security flags
  INSERT INTO public.user_security_flags (user_id, email, last_login_ip, last_login_at)
  VALUES (p_user_id, p_email, p_ip_address, NOW())
  ON CONFLICT (email) 
  DO UPDATE SET 
    last_login_ip = p_ip_address,
    last_login_at = NOW(),
    vpn_login_count = CASE WHEN p_is_vpn THEN user_security_flags.vpn_login_count + 1 ELSE user_security_flags.vpn_login_count END,
    updated_at = NOW();
  
  -- Update unique counts
  UPDATE public.user_security_flags SET
    unique_ips_count = (SELECT COUNT(DISTINCT ip_address) FROM public.user_known_ips WHERE user_id = p_user_id),
    unique_countries_count = (SELECT COUNT(DISTINCT location_info->>'country') FROM public.user_known_ips WHERE user_id = p_user_id AND location_info->>'country' IS NOT NULL)
  WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users who have used a specific IP
CREATE OR REPLACE FUNCTION get_users_by_ip(p_ip_address VARCHAR(45))
RETURNS TABLE (
  user_id UUID,
  email VARCHAR(255),
  login_count INTEGER,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_trusted BOOLEAN,
  is_blocked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uk.user_id,
    uk.email,
    uk.login_count,
    uk.first_seen_at,
    uk.last_seen_at,
    uk.is_trusted,
    uk.is_blocked
  FROM public.user_known_ips uk
  WHERE uk.ip_address = p_ip_address
  ORDER BY uk.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all IPs used by a specific user/email
CREATE OR REPLACE FUNCTION get_ips_by_user(p_user_id UUID)
RETURNS TABLE (
  ip_address VARCHAR(45),
  login_count INTEGER,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_trusted BOOLEAN,
  is_blocked BOOLEAN,
  country VARCHAR(100),
  city VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uk.ip_address,
    uk.login_count,
    uk.first_seen_at,
    uk.last_seen_at,
    uk.is_trusted,
    uk.is_blocked,
    (uk.location_info->>'country')::VARCHAR(100),
    (uk.location_info->>'city')::VARCHAR(100)
  FROM public.user_known_ips uk
  WHERE uk.user_id = p_user_id
  ORDER BY uk.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect multiple accounts from same IP
CREATE OR REPLACE FUNCTION detect_multi_account_ips(min_accounts INTEGER DEFAULT 3)
RETURNS TABLE (
  ip_address VARCHAR(45),
  account_count BIGINT,
  emails TEXT[],
  user_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uk.ip_address,
    COUNT(DISTINCT uk.user_id) as account_count,
    ARRAY_AGG(DISTINCT uk.email) as emails,
    ARRAY_AGG(DISTINCT uk.user_id) as user_ids
  FROM public.user_known_ips uk
  GROUP BY uk.ip_address
  HAVING COUNT(DISTINCT uk.user_id) >= min_accounts
  ORDER BY account_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update security flags updated_at
CREATE OR REPLACE FUNCTION update_user_security_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_security_flags_timestamp
  BEFORE UPDATE ON public.user_security_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_user_security_flags_updated_at();
