-- ============================================
-- Fix Business Accounts Status and Admin Access
-- Migration: Add PENDING_APPROVAL status and fix admin RLS policies
-- ============================================

-- 1. Fix business_accounts status constraint to include PENDING_APPROVAL
ALTER TABLE public.business_accounts DROP CONSTRAINT IF EXISTS business_accounts_status_check;
ALTER TABLE public.business_accounts ADD CONSTRAINT business_accounts_status_check 
  CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL'));

-- 2. Fix users table role constraint to include all role types
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'customer', 'business', 'BUSINESS_ACCOUNT', 'APP_OWNER_ADMIN', 'PERSONAL_ACCOUNT'));

-- 3. Create helper function to check if user is admin (checking multiple tables/roles)
CREATE OR REPLACE FUNCTION public.is_admin_v2()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check in users table
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'APP_OWNER_ADMIN')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check in user_profiles table
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'APP_OWNER_ADMIN'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop and recreate user_profiles policies for admin full access
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin_v2());

CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin_v2());

CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles FOR DELETE
  USING (public.is_admin_v2());

-- 5. Drop and recreate business_accounts policies for admin full access
DROP POLICY IF EXISTS "Admins can read all business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Admins can update all business accounts" ON public.business_accounts;
DROP POLICY IF EXISTS "Admins can delete business accounts" ON public.business_accounts;

CREATE POLICY "Admins can read all business accounts"
  ON public.business_accounts FOR SELECT
  USING (public.is_admin_v2());

CREATE POLICY "Admins can update all business accounts"
  ON public.business_accounts FOR UPDATE
  USING (public.is_admin_v2());

CREATE POLICY "Admins can delete business accounts"
  ON public.business_accounts FOR DELETE
  USING (public.is_admin_v2());

-- 6. Drop and recreate users table policies for admin full access
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Admins can manage all users"
  ON public.users FOR ALL
  USING (public.is_admin_v2());

-- 7. Allow service role to insert into users table (for signup)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- 8. Grant full permissions to service_role
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.business_accounts TO service_role;

-- 9. Create trigger for business_accounts updated_at
DROP TRIGGER IF EXISTS update_business_accounts_updated_at ON public.business_accounts;
CREATE TRIGGER update_business_accounts_updated_at 
  BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- COMPLETED
-- ============================================
