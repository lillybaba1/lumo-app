-- Migration: Seller Reviews & Ratings
-- Description: Customer reviews for sellers, responses, and badges

-- Seller reviews (rating the boutique/seller)
CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  shipping_rating INT CHECK (shipping_rating >= 1 AND shipping_rating <= 5),
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  images JSONB DEFAULT '[]',
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller review responses
CREATE TABLE IF NOT EXISTS seller_review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES seller_reviews(id) ON DELETE CASCADE,
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id)
);

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES seller_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Seller badges
CREATE TABLE IF NOT EXISTS seller_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  criteria JSONB, -- e.g., {"min_rating": 4.5, "min_reviews": 50, "min_orders": 100}
  tier INT DEFAULT 1, -- 1=bronze, 2=silver, 3=gold, 4=platinum
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller badge assignments
CREATE TABLE IF NOT EXISTS seller_badge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES seller_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(boutique_id, badge_id)
);

-- Seller rating summary (cached for performance)
CREATE TABLE IF NOT EXISTS seller_rating_summary (
  boutique_id UUID PRIMARY KEY REFERENCES boutiques(id) ON DELETE CASCADE,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  rating_1_count INT DEFAULT 0,
  rating_2_count INT DEFAULT 0,
  rating_3_count INT DEFAULT 0,
  rating_4_count INT DEFAULT 0,
  rating_5_count INT DEFAULT 0,
  average_communication DECIMAL(3,2),
  average_shipping DECIMAL(3,2),
  average_quality DECIMAL(3,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_reviews_boutique ON seller_reviews(boutique_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_customer ON seller_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_rating ON seller_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_status ON seller_reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON seller_review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_badge_assignments_boutique ON seller_badge_assignments(boutique_id);

-- Enable RLS
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_badge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_rating_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_reviews
CREATE POLICY "Anyone can view approved reviews"
  ON seller_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Customers can create reviews"
  ON seller_reviews FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own reviews"
  ON seller_reviews FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Sellers can view their boutique reviews"
  ON seller_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_reviews.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for seller_review_responses
CREATE POLICY "Anyone can view responses"
  ON seller_review_responses FOR SELECT
  USING (TRUE);

CREATE POLICY "Sellers can manage their responses"
  ON seller_review_responses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = seller_review_responses.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- RLS Policies for review_helpful_votes
CREATE POLICY "Anyone can view vote counts"
  ON review_helpful_votes FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can vote"
  ON review_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their votes"
  ON review_helpful_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for seller_badges
CREATE POLICY "Anyone can view badges"
  ON seller_badges FOR SELECT
  USING (TRUE);

-- RLS Policies for seller_badge_assignments
CREATE POLICY "Anyone can view badge assignments"
  ON seller_badge_assignments FOR SELECT
  USING (TRUE);

-- RLS Policies for seller_rating_summary
CREATE POLICY "Anyone can view rating summaries"
  ON seller_rating_summary FOR SELECT
  USING (TRUE);

-- Function to update rating summary when review is added/updated
CREATE OR REPLACE FUNCTION update_seller_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO seller_rating_summary (boutique_id)
  VALUES (COALESCE(NEW.boutique_id, OLD.boutique_id))
  ON CONFLICT (boutique_id) DO NOTHING;

  UPDATE seller_rating_summary
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved'
    ),
    rating_1_count = (
      SELECT COUNT(*) FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND rating = 1
    ),
    rating_2_count = (
      SELECT COUNT(*) FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND rating = 2
    ),
    rating_3_count = (
      SELECT COUNT(*) FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND rating = 3
    ),
    rating_4_count = (
      SELECT COUNT(*) FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND rating = 4
    ),
    rating_5_count = (
      SELECT COUNT(*) FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND rating = 5
    ),
    average_communication = (
      SELECT AVG(communication_rating)
      FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND communication_rating IS NOT NULL
    ),
    average_shipping = (
      SELECT AVG(shipping_rating)
      FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND shipping_rating IS NOT NULL
    ),
    average_quality = (
      SELECT AVG(quality_rating)
      FROM seller_reviews
      WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id)
      AND status = 'approved' AND quality_rating IS NOT NULL
    ),
    updated_at = NOW()
  WHERE boutique_id = COALESCE(NEW.boutique_id, OLD.boutique_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for rating summary updates
DROP TRIGGER IF EXISTS on_review_change ON seller_reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_rating_summary();

-- Insert default badges
INSERT INTO seller_badges (name, description, icon, color, criteria, tier) VALUES
  ('Top Rated', 'Maintained 4.8+ rating with 50+ reviews', 'star', '#fbbf24', '{"min_rating": 4.8, "min_reviews": 50}', 3),
  ('Fast Shipper', 'Ships orders within 24 hours', 'truck', '#22c55e', '{"max_ship_time_hours": 24}', 2),
  ('Super Seller', 'Completed 500+ orders with 4.5+ rating', 'award', '#8b5cf6', '{"min_orders": 500, "min_rating": 4.5}', 4),
  ('Quick Responder', 'Responds to messages within 2 hours', 'message-circle', '#06b6d4', '{"max_response_time_hours": 2}', 2),
  ('New Seller', 'Recently joined the marketplace', 'sparkles', '#f472b6', '{}', 1),
  ('Verified Business', 'Verified business registration', 'check-circle', '#10b981', '{}', 2)
ON CONFLICT (name) DO NOTHING;
