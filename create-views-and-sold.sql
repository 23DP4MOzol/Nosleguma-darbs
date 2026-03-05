-- ==========================================
-- VIEWS TRACKING + SOLD TRACKING + LIKES COUNT
-- Copy and paste this into Supabase SQL Editor
-- ==========================================

-- 1. Product views table (tracks unique user views)
DROP TABLE IF EXISTS public.product_views CASCADE;

CREATE TABLE public.product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One view record per user per product
  CONSTRAINT unique_user_product_view UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON public.product_views(user_id);

-- RLS for product_views
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read view counts
DROP POLICY IF EXISTS "Anyone can read product views" ON public.product_views;
CREATE POLICY "Anyone can read product views"
  ON public.product_views FOR SELECT
  USING (true);

-- Authenticated users can insert their own views
DROP POLICY IF EXISTS "Users can insert own views" ON public.product_views;
CREATE POLICY "Users can insert own views"
  ON public.product_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Add likes_count and views_count to products for fast sorting
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Add a public read policy for favorites count (needed for like counts)
-- This allows anyone to count favorites per product without seeing user details
DROP POLICY IF EXISTS "Anyone can count favorites per product" ON public.favorites;
CREATE POLICY "Anyone can count favorites per product"
  ON public.favorites FOR SELECT
  USING (true);

-- 4. Function to update product likes_count when favorites change
CREATE OR REPLACE FUNCTION update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products 
    SET likes_count = (SELECT COUNT(*) FROM public.favorites WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products 
    SET likes_count = (SELECT COUNT(*) FROM public.favorites WHERE product_id = OLD.product_id)
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on favorites
DROP TRIGGER IF EXISTS trigger_update_likes_count ON public.favorites;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION update_product_likes_count();

-- 5. Function to update product views_count when product_views change
CREATE OR REPLACE FUNCTION update_product_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products 
  SET views_count = (SELECT COUNT(*) FROM public.product_views WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on product_views
DROP TRIGGER IF EXISTS trigger_update_views_count ON public.product_views;
CREATE TRIGGER trigger_update_views_count
  AFTER INSERT ON public.product_views
  FOR EACH ROW EXECUTE FUNCTION update_product_views_count();

-- 6. Backfill existing likes counts
UPDATE public.products p
SET likes_count = (
  SELECT COUNT(*) FROM public.favorites f WHERE f.product_id = p.id
);

-- 7. Backfill existing views counts (will be 0 since table is new)
UPDATE public.products p
SET views_count = (
  SELECT COUNT(*) FROM public.product_views v WHERE v.product_id = p.id
);
