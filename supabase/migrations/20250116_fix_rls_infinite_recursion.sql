-- ============================================
-- Fix RLS Infinite Recursion
-- Migration: Fix infinite recursion in RLS policies
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view published pages" ON public.pages;
DROP POLICY IF EXISTS "Admins can manage pages" ON public.pages;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins only - warehouse locations" ON public.warehouse_locations;
DROP POLICY IF EXISTS "Admins only - inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Admins only - stock alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Users can view own return requests" ON public.return_requests;
DROP POLICY IF EXISTS "Admins can manage all return requests" ON public.return_requests;
DROP POLICY IF EXISTS "Admins only - auth rate limits" ON public.auth_rate_limits;

-- Create a security definer function to check if user is admin
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the helper function

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Categories: Public read, admin write
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- Products: Public read active, admin write
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- Orders: Users see own, admins see all
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

-- Reviews: Public read published, admins can see all
CREATE POLICY "Anyone can view published reviews"
  ON public.reviews FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin());

-- Coupons: Admin write
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (public.is_admin());

-- Pages: Public read published, admin write
CREATE POLICY "Anyone can view published pages"
  ON public.pages FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins can manage pages"
  ON public.pages FOR ALL
  USING (public.is_admin());

-- Site Settings: Admin write
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin());

-- Admin-only tables
CREATE POLICY "Admins only - warehouse locations"
  ON public.warehouse_locations FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins only - inventory transactions"
  ON public.inventory_transactions FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins only - stock alerts"
  ON public.stock_alerts FOR ALL
  USING (public.is_admin());

-- Return Requests: Users see own, admins see all
CREATE POLICY "Users can view own return requests"
  ON public.return_requests FOR SELECT
  USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Admins can manage all return requests"
  ON public.return_requests FOR ALL
  USING (public.is_admin());

-- Auth Rate Limits: Admin only
CREATE POLICY "Admins only - auth rate limits"
  ON public.auth_rate_limits FOR ALL
  USING (public.is_admin());

-- ============================================
-- COMPLETED
-- ============================================
-- RLS infinite recursion fixed!
