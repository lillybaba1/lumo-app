-- Create the payments table for tracking all payment records
-- This table was referenced by paymentService.ts but never created

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GMD',
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed', 'Refunded')),
  transaction_id text,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for looking up payments by order
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- Index for looking up payments by transaction_id (used by PayDunya IPN)
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- Index for looking up payments by customer email
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON public.payments(customer_email);

-- Index for looking up payments by status
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- RLS: Enable row-level security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (our server-side code uses supabaseAdmin)
CREATE POLICY "Service role full access on payments"
  ON public.payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE public.payments IS 'Payment records for all orders - tracks COD, PayDunya, and Mobile Money payments';
