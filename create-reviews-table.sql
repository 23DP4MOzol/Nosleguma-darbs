-- ==========================================
-- REVIEWS TABLE FOR VENDLY
-- Copy and paste this into Supabase SQL Editor
-- ==========================================

-- Drop old table if re-running
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Create reviews table
-- NOTE: References public.users(id) so PostgREST embedded joins work
--       (e.g. reviews -> users!buyer_id(username))
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Enforce: 1 review per buyer per seller
  CONSTRAINT unique_buyer_seller_review UNIQUE (buyer_id, seller_id),
  -- Prevent self-reviews
  CONSTRAINT no_self_review CHECK (buyer_id != seller_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (true);

-- Authenticated users can insert their own reviews (1 per seller enforced by UNIQUE constraint)
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = buyer_id);

-- ==========================================
-- Also fix user_transactions CHECK constraint
-- to allow all transaction types used by the app
-- ==========================================
ALTER TABLE public.user_transactions 
  DROP CONSTRAINT IF EXISTS user_transactions_transaction_type_check;

ALTER TABLE public.user_transactions 
  ADD CONSTRAINT user_transactions_transaction_type_check 
  CHECK (transaction_type IN (
    'deposit', 'withdrawal', 'purchase', 'sale', 'refund', 
    'admin_adjustment', 'escrow_hold', 'escrow_release',
    'topup', 'fee', 'withdraw'
  ));
