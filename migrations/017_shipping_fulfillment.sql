-- Migration: Shipping & Fulfillment
-- Description: Custom shipping rates, label generation, tracking, local pickup

-- Shipping zones
CREATE TABLE IF NOT EXISTS boutique_shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  countries JSONB DEFAULT '[]', -- array of country codes
  states JSONB DEFAULT '[]', -- array of state/region codes
  zip_codes JSONB, -- optional specific zip codes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping methods/rates
CREATE TABLE IF NOT EXISTS boutique_shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES boutique_shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Standard Shipping", "Express"
  description TEXT,
  
  -- Rate calculation
  rate_type TEXT NOT NULL CHECK (rate_type IN ('flat', 'weight', 'price', 'item', 'free')),
  base_rate DECIMAL(10,2) DEFAULT 0,
  per_item_rate DECIMAL(10,2) DEFAULT 0,
  per_weight_rate DECIMAL(10,2) DEFAULT 0, -- per lb/kg
  weight_unit TEXT DEFAULT 'lb' CHECK (weight_unit IN ('lb', 'kg')),
  
  -- Free shipping threshold
  free_shipping_threshold DECIMAL(10,2),
  
  -- Delivery time
  min_delivery_days INT,
  max_delivery_days INT,
  
  -- Carrier info
  carrier TEXT, -- USPS, UPS, FedEx, etc.
  service_code TEXT, -- carrier-specific service code
  
  is_active BOOLEAN DEFAULT TRUE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Local pickup locations
CREATE TABLE IF NOT EXISTS boutique_pickup_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  phone TEXT,
  instructions TEXT,
  
  -- Pickup hours
  hours JSONB DEFAULT '{}', -- {"monday": {"open": "09:00", "close": "17:00"}, ...}
  
  -- Lead time
  lead_time_hours INT DEFAULT 24, -- how long until order is ready
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping labels (generated labels)
CREATE TABLE IF NOT EXISTS boutique_shipping_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Carrier & service
  carrier TEXT NOT NULL,
  service TEXT NOT NULL,
  
  -- Label details
  tracking_number TEXT,
  label_url TEXT,
  label_format TEXT DEFAULT 'pdf',
  
  -- Shipment details
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,
  package_details JSONB, -- weight, dimensions
  
  -- Cost
  rate DECIMAL(10,2),
  insurance_amount DECIMAL(10,2),
  
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'purchased', 'voided', 'used')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment tracking
CREATE TABLE IF NOT EXISTS boutique_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label_id UUID REFERENCES boutique_shipping_labels(id),
  
  -- Tracking
  carrier TEXT NOT NULL,
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'label_created', 'picked_up', 'in_transit', 
    'out_for_delivery', 'delivered', 'exception', 'returned'
  )),
  
  -- Dates
  estimated_delivery_date DATE,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Events log
  tracking_events JSONB DEFAULT '[]', -- array of tracking events
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping settings
CREATE TABLE IF NOT EXISTS boutique_shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  
  -- Origin address
  origin_address JSONB,
  
  -- Packaging options
  default_package_weight DECIMAL(10,2) DEFAULT 0.5,
  package_presets JSONB DEFAULT '[]', -- saved package sizes
  
  -- Carrier accounts
  carrier_accounts JSONB DEFAULT '{}', -- {usps: {account_id: ...}, ups: {...}}
  
  -- Preferences
  auto_fulfill BOOLEAN DEFAULT FALSE,
  send_tracking_email BOOLEAN DEFAULT TRUE,
  signature_required BOOLEAN DEFAULT FALSE,
  insurance_required BOOLEAN DEFAULT FALSE,
  
  -- Local pickup
  local_pickup_enabled BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipping_zones_boutique ON boutique_shipping_zones(boutique_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_boutique ON boutique_shipping_rates(boutique_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone ON boutique_shipping_rates(zone_id);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_boutique ON boutique_pickup_locations(boutique_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_order ON boutique_shipping_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON boutique_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON boutique_shipments(tracking_number);

-- Enable RLS
ALTER TABLE boutique_shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_shipping_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Sellers can manage their shipping

CREATE POLICY "Sellers can manage shipping zones"
  ON boutique_shipping_zones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_shipping_zones.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active shipping rates"
  ON boutique_shipping_rates FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Sellers can manage shipping rates"
  ON boutique_shipping_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_shipping_rates.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active pickup locations"
  ON boutique_pickup_locations FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Sellers can manage pickup locations"
  ON boutique_pickup_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_pickup_locations.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can manage shipping labels"
  ON boutique_shipping_labels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_shipping_labels.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Order customers can view their shipments"
  ON boutique_shipments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = boutique_shipments.order_id
      AND o.customer_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can manage shipments"
  ON boutique_shipments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_shipments.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers can manage shipping settings"
  ON boutique_shipping_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_shipping_settings.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );
