-- ============================================
-- Enforce unique business names (case-insensitive)
-- ============================================
-- Prevents multiple business accounts from registering with the same name.
-- Uses a unique index on LOWER(TRIM(business_name)) so that
-- "My Store", "my store", and " MY STORE " are all treated as the same name.

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_accounts_unique_name
  ON public.business_accounts (LOWER(TRIM(business_name)));
