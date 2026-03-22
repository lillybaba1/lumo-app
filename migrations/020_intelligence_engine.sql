-- ═══════════════════════════════════════════════════════════════════
-- JulaZone Intelligence Engine — Database Setup
-- Creates user_activity tracking table and increment functions
-- ═══════════════════════════════════════════════════════════════════

-- 1. User Activity Tracking Table
-- Tracks: product views, cart adds, purchases, searches, wishlist adds
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,                          -- anonymous session tracking
  event_type TEXT NOT NULL,                 -- 'view', 'cart_add', 'purchase', 'search', 'wishlist_add', 'wishlist_remove'
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID,                         -- category context
  search_query TEXT,                        -- for search events
  metadata JSONB DEFAULT '{}',              -- extra context (price, source page, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_product_id ON public.user_activity(product_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_event_type ON public.user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_product ON public.user_activity(user_id, product_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON public.user_activity(session_id, event_type);

-- 2. Function to increment product view_count atomically
CREATE OR REPLACE FUNCTION increment_product_view_count(pid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = pid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to increment product sales_count atomically
CREATE OR REPLACE FUNCTION increment_product_sales_count(pid UUID, qty INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET sales_count = COALESCE(sales_count, 0) + qty
  WHERE id = pid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Get products frequently bought together
-- Returns product IDs that appear in the same orders as the given product
CREATE OR REPLACE FUNCTION get_frequently_bought_together(target_product_id UUID, max_results INTEGER DEFAULT 6)
RETURNS TABLE(product_id UUID, co_purchase_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH target_orders AS (
    SELECT o.id AS order_id, o.items
    FROM public.orders o
    WHERE o.items::text LIKE '%' || target_product_id::text || '%'
      AND o.status != 'Cancelled'
  ),
  co_products AS (
    SELECT (item->>'id')::UUID AS co_product_id
    FROM target_orders,
         jsonb_array_elements(items) AS item
    WHERE (item->'product'->>'id')::UUID != target_product_id
      OR (item->>'id')::UUID != target_product_id
  )
  SELECT cp.co_product_id AS product_id, COUNT(*) AS co_purchase_count
  FROM co_products cp
  JOIN public.products p ON p.id = cp.co_product_id AND p.is_active = true
  GROUP BY cp.co_product_id
  ORDER BY co_purchase_count DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies — users can only read/insert their own activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own activity
CREATE POLICY user_activity_insert ON public.user_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own activity
CREATE POLICY user_activity_select ON public.user_activity
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow anon users to insert activity (for session-based tracking)
CREATE POLICY user_activity_anon_insert ON public.user_activity
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Service role bypass (for analytics/admin)
CREATE POLICY user_activity_service ON public.user_activity
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 6. Auto-cleanup: remove activity older than 90 days (optional, run as cron)
-- SELECT cron.schedule('cleanup-old-activity', '0 3 * * 0', 
--   $$DELETE FROM public.user_activity WHERE created_at < NOW() - INTERVAL '90 days'$$
-- );
