-- Migration: Transform Lumo into Multi-Seller Marketplace
-- This migration adds support for business accounts (sellers) and multi-seller marketplace features

-- 1. Create business_accounts table
CREATE TABLE IF NOT EXISTS business_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    contact_person_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    business_phone VARCHAR(50),
    tax_id VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    logo TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION')),

    -- Payout settings
    payout_method VARCHAR(50) CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe')),
    payout_details JSONB,

    -- Shipping and return policies
    shipping_policies TEXT,
    return_policy TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,

    -- Unique constraint: one business account per user
    UNIQUE(owner_user_id)
);

-- Create index on owner_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_business_accounts_owner ON business_accounts(owner_user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_business_accounts_status ON business_accounts(status);

-- 2. Update users table to support new roles
-- Add business_account_id column (for BUSINESS_ACCOUNT users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS business_account_id UUID REFERENCES business_accounts(id) ON DELETE SET NULL;

-- Create index on business_account_id
CREATE INDEX IF NOT EXISTS idx_users_business_account ON users(business_account_id);

-- Note: The role column already exists, but we'll need to update its values
-- The application will handle role migration: 'admin' -> 'APP_OWNER_ADMIN', 'customer' -> 'PERSONAL_ACCOUNT'

-- 3. Add seller_id to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES business_accounts(id) ON DELETE CASCADE;

-- Create index on seller_id for fast filtering
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);

-- 4. Add seller tracking to orders
-- Add customer_id to orders (for linking to user accounts)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index on customer_id
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Note: Order items already include product info, and since products now have seller_id,
-- we can infer the seller from the product. For better performance, we could denormalize
-- seller_id into order items in a future migration if needed.

-- 5. Create a default "App Owner" business account for existing products
-- This will be done via application code after migration, as it needs to:
-- 1. Find the first admin user
-- 2. Create a business account for them
-- 3. Update all products to reference this business account

-- Migration complete
-- Next steps (to be done via application):
-- 1. Run data migration script to create default App Owner business account
-- 2. Backfill seller_id for all existing products
-- 3. Update user roles: 'admin' -> 'APP_OWNER_ADMIN', 'customer' -> 'PERSONAL_ACCOUNT'
