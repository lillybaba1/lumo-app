-- Create visitors table for tracking website visitors
CREATE TABLE IF NOT EXISTS visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    ip_address TEXT,
    country TEXT,
    country_code TEXT,
    city TEXT,
    region TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    timezone TEXT,
    isp TEXT,
    user_agent TEXT,
    device_type TEXT DEFAULT 'unknown' CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    browser TEXT,
    os TEXT,
    referrer TEXT,
    landing_page TEXT NOT NULL,
    page_views INTEGER DEFAULT 1,
    session_duration INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_returning BOOLEAN DEFAULT FALSE,
    consent_given BOOLEAN DEFAULT FALSE
);

-- Create page_views table for tracking individual page visits
CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    time_on_page INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_visitors_last_activity ON visitors(last_activity);
CREATE INDEX IF NOT EXISTS idx_visitors_country ON visitors(country);
CREATE INDEX IF NOT EXISTS idx_visitors_device_type ON visitors(device_type);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- Create function to increment page views
CREATE OR REPLACE FUNCTION increment_page_views(vid TEXT)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE visitors 
    SET page_views = page_views + 1,
        last_activity = NOW()
    WHERE visitor_id = vid
    RETURNING page_views INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (admin only)
CREATE POLICY "Service role can manage visitors" ON visitors
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage page_views" ON page_views
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous inserts for tracking (but not reads)
CREATE POLICY "Anonymous can insert visitors" ON visitors
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anonymous can insert page_views" ON page_views
    FOR INSERT
    WITH CHECK (true);
