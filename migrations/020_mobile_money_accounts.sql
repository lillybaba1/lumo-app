-- Add mobile_money_accounts column to business_accounts table
-- This stores the seller's mobile money details so buyers can pay them directly

ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS mobile_money_accounts jsonb DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.business_accounts.mobile_money_accounts IS 'Array of mobile money accounts [{provider, number, accountName}] for receiving buyer payments';

-- Update the payment_method CHECK constraint on orders table to allow new methods
-- First drop the old constraint if it exists, then add updated one
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Update payment_method column to allow new payment methods (no CHECK constraint, or wider one)
-- The column is TEXT NOT NULL so we just need to make sure the constraint allows our new values
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('Wave Money', 'Cash on Delivery', 'Credit Card', 'Bank Transfer', 'PayDunya', 'Mobile Money'));

-- Note: payments table uses no CHECK constraint (text column only)
