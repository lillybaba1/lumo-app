-- Add 'business' role to users table constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'customer', 'business'));

-- Grant access to service role
GRANT ALL ON public.users TO service_role;
