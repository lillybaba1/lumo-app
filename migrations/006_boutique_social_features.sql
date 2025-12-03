-- Migration: Boutique Social Features (Follows, Likes, Comments)
-- Enables users to follow boutiques, like products, and leave comments

-- 1. Create boutique_followers table
CREATE TABLE IF NOT EXISTS public.boutique_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id, user_id)
);

-- 2. Create boutique_likes table (for liking the boutique itself)
CREATE TABLE IF NOT EXISTS public.boutique_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boutique_id, user_id)
);

-- 3. Create boutique_comments table
CREATE TABLE IF NOT EXISTS public.boutique_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.boutique_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add follower/like counts to boutiques table
ALTER TABLE public.boutiques 
  ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_boutique_followers_boutique ON public.boutique_followers(boutique_id);
CREATE INDEX IF NOT EXISTS idx_boutique_followers_user ON public.boutique_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_boutique_likes_boutique ON public.boutique_likes(boutique_id);
CREATE INDEX IF NOT EXISTS idx_boutique_likes_user ON public.boutique_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_boutique_comments_boutique ON public.boutique_comments(boutique_id);
CREATE INDEX IF NOT EXISTS idx_boutique_comments_user ON public.boutique_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_boutique_comments_parent ON public.boutique_comments(parent_id);

-- 6. RLS Policies for boutique_followers
ALTER TABLE public.boutique_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view followers of published boutiques"
  ON public.boutique_followers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boutiques WHERE id = boutique_id AND is_published = true
    )
  );

CREATE POLICY "Authenticated users can follow boutiques"
  ON public.boutique_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow boutiques"
  ON public.boutique_followers FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS Policies for boutique_likes
ALTER TABLE public.boutique_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes of published boutiques"
  ON public.boutique_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boutiques WHERE id = boutique_id AND is_published = true
    )
  );

CREATE POLICY "Authenticated users can like boutiques"
  ON public.boutique_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike boutiques"
  ON public.boutique_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 8. RLS Policies for boutique_comments
ALTER TABLE public.boutique_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on published boutiques"
  ON public.boutique_comments FOR SELECT
  USING (
    is_hidden = false AND
    EXISTS (
      SELECT 1 FROM public.boutiques WHERE id = boutique_id AND is_published = true
    )
  );

CREATE POLICY "Authenticated users can add comments"
  ON public.boutique_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit their own comments"
  ON public.boutique_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.boutique_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Boutique owners can hide comments on their boutiques
CREATE POLICY "Boutique owners can hide comments"
  ON public.boutique_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boutiques b
      JOIN public.business_accounts ba ON b.business_account_id = ba.id
      WHERE b.id = boutique_id AND ba.owner_user_id = auth.uid()
    )
  );

-- 9. Functions to update counts
CREATE OR REPLACE FUNCTION update_boutique_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.boutiques SET follower_count = follower_count + 1 WHERE id = NEW.boutique_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.boutiques SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.boutique_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_boutique_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.boutiques SET like_count = like_count + 1 WHERE id = NEW.boutique_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.boutiques SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.boutique_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_boutique_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.boutiques SET comment_count = comment_count + 1 WHERE id = NEW.boutique_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.boutiques SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.boutique_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create triggers
DROP TRIGGER IF EXISTS trigger_update_follower_count ON public.boutique_followers;
CREATE TRIGGER trigger_update_follower_count
  AFTER INSERT OR DELETE ON public.boutique_followers
  FOR EACH ROW EXECUTE FUNCTION update_boutique_follower_count();

DROP TRIGGER IF EXISTS trigger_update_like_count ON public.boutique_likes;
CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON public.boutique_likes
  FOR EACH ROW EXECUTE FUNCTION update_boutique_like_count();

DROP TRIGGER IF EXISTS trigger_update_comment_count ON public.boutique_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON public.boutique_comments
  FOR EACH ROW EXECUTE FUNCTION update_boutique_comment_count();

-- 11. Comments
COMMENT ON TABLE public.boutique_followers IS 'Tracks users who follow boutiques for notifications';
COMMENT ON TABLE public.boutique_likes IS 'Tracks users who have liked/favorited boutiques';
COMMENT ON TABLE public.boutique_comments IS 'Comments/reviews on boutique pages';
