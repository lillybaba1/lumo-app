-- Migration: Boutique Customization
-- Description: Custom themes, banners, featured sections, and about page

-- Boutique theme customization
CREATE TABLE IF NOT EXISTS boutique_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  
  -- Colors
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#f59e0b',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#1f2937',
  
  -- Typography
  heading_font TEXT DEFAULT 'Inter',
  body_font TEXT DEFAULT 'Inter',
  
  -- Layout
  layout_style TEXT DEFAULT 'grid' CHECK (layout_style IN ('grid', 'list', 'masonry')),
  products_per_row INT DEFAULT 4,
  show_sidebar BOOLEAN DEFAULT TRUE,
  
  -- Header/Footer
  header_style TEXT DEFAULT 'default' CHECK (header_style IN ('default', 'centered', 'minimal')),
  footer_style TEXT DEFAULT 'default' CHECK (footer_style IN ('default', 'minimal', 'expanded')),
  
  -- Custom CSS (for pro/enterprise)
  custom_css TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id)
);

-- Boutique banners/slideshow
CREATE TABLE IF NOT EXISTS boutique_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Featured sections/collections
CREATE TABLE IF NOT EXISTS boutique_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section_type TEXT NOT NULL CHECK (section_type IN ('products', 'categories', 'banner', 'text', 'video', 'instagram', 'testimonials')),
  content JSONB DEFAULT '{}', -- flexible content based on section type
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boutique about/story page
CREATE TABLE IF NOT EXISTS boutique_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  
  -- Story section
  story_title TEXT DEFAULT 'Our Story',
  story_content TEXT,
  story_image_url TEXT,
  
  -- Mission/Values
  mission_statement TEXT,
  values JSONB DEFAULT '[]', -- array of {title, description, icon}
  
  -- Team section
  show_team BOOLEAN DEFAULT FALSE,
  team_members JSONB DEFAULT '[]', -- array of {name, role, image, bio}
  
  -- Contact info
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Social proof
  press_mentions JSONB DEFAULT '[]', -- array of {name, logo, quote, url}
  certifications JSONB DEFAULT '[]', -- array of {name, image, description}
  
  -- FAQ
  faqs JSONB DEFAULT '[]', -- array of {question, answer}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id)
);

-- Boutique social links
CREATE TABLE IF NOT EXISTS boutique_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'pinterest', 'linkedin', 'website')),
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id, platform)
);

-- Boutique announcements bar
CREATE TABLE IF NOT EXISTS boutique_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT,
  background_color TEXT DEFAULT '#1f2937',
  text_color TEXT DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_themes_boutique ON boutique_themes(boutique_id);
CREATE INDEX IF NOT EXISTS idx_banners_boutique ON boutique_banners(boutique_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON boutique_banners(is_active, position);
CREATE INDEX IF NOT EXISTS idx_sections_boutique ON boutique_sections(boutique_id);
CREATE INDEX IF NOT EXISTS idx_sections_active ON boutique_sections(is_active, position);
CREATE INDEX IF NOT EXISTS idx_about_boutique ON boutique_about(boutique_id);
CREATE INDEX IF NOT EXISTS idx_social_boutique ON boutique_social_links(boutique_id);
CREATE INDEX IF NOT EXISTS idx_announcements_boutique ON boutique_announcements(boutique_id);

-- Enable RLS
ALTER TABLE boutique_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_about ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Anyone can view, sellers can edit their own

-- boutique_themes
CREATE POLICY "Anyone can view themes"
  ON boutique_themes FOR SELECT USING (TRUE);

CREATE POLICY "Sellers can manage their theme"
  ON boutique_themes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_themes.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_banners
CREATE POLICY "Anyone can view active banners"
  ON boutique_banners FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Sellers can manage their banners"
  ON boutique_banners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_banners.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_sections
CREATE POLICY "Anyone can view active sections"
  ON boutique_sections FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Sellers can manage their sections"
  ON boutique_sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_sections.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_about
CREATE POLICY "Anyone can view about pages"
  ON boutique_about FOR SELECT USING (TRUE);

CREATE POLICY "Sellers can manage their about page"
  ON boutique_about FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_about.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_social_links
CREATE POLICY "Anyone can view social links"
  ON boutique_social_links FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Sellers can manage their social links"
  ON boutique_social_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_social_links.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );

-- boutique_announcements
CREATE POLICY "Anyone can view active announcements"
  ON boutique_announcements FOR SELECT
  USING (
    is_active = TRUE AND
    (start_date IS NULL OR start_date <= NOW()) AND
    (end_date IS NULL OR end_date >= NOW())
  );

CREATE POLICY "Sellers can manage their announcements"
  ON boutique_announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boutiques b
      JOIN business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_announcements.boutique_id
      AND ba.owner_user_id = auth.uid()
    )
  );
