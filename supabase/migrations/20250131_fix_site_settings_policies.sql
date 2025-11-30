-- Fix site_settings RLS policies to match new role names
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can delete site settings" ON public.site_settings;

-- Recreate policies with correct role name
CREATE POLICY "Admins can insert site settings"
    ON public.site_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'APP_OWNER_ADMIN'
        )
    );

CREATE POLICY "Admins can update site settings"
    ON public.site_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'APP_OWNER_ADMIN'
        )
    );

CREATE POLICY "Admins can delete site settings"
    ON public.site_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'APP_OWNER_ADMIN'
        )
    );

-- Grant full access to service_role (used by supabaseAdmin)
GRANT ALL ON public.site_settings TO service_role;
