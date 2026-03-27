-- Fix orders status CHECK constraint to include escrow statuses
-- Also update payment_method constraint to include ModemPay

-- Drop old status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with all escrow statuses (keeping Processing for backward compat)
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('Pending', 'Paid', 'Preparing', 'Shipped', 'Delivered', 'Payout Pending', 'Completed', 'Disputed', 'Cancelled', 'Processing'));
