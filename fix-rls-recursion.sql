-- Fix for RLS Policy Recursion Issue
-- Run this in your Supabase SQL Editor or as a new migration

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage pages" ON public.pages;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

-- Create a function to check if user is admin (using auth.jwt())
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a simpler admin check function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate users policies without recursion
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Recreate other policies using the admin function
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage pages"
  ON public.pages FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (is_admin());
