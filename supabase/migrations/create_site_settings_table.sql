-- Create site_settings table for storing application-wide settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read site settings
CREATE POLICY "Anyone can read site settings"
    ON public.site_settings
    FOR SELECT
    USING (true);

-- Policy: Only admins can insert site settings
CREATE POLICY "Admins can insert site settings"
    ON public.site_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Policy: Only admins can update site settings
CREATE POLICY "Admins can update site settings"
    ON public.site_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Policy: Only admins can delete site settings
CREATE POLICY "Admins can delete site settings"
    ON public.site_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Insert default theme settings
INSERT INTO public.site_settings (key, value)
VALUES (
    'theme',
    '{
        "primaryColor": "#3b82f6",
        "accentColor": "#10b981",
        "backgroundColor": "#ffffff",
        "backgroundImage": "",
        "foregroundImage": "",
        "foregroundImageScale": 100,
        "foregroundImagePositionX": 50,
        "foregroundImagePositionY": 50
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
