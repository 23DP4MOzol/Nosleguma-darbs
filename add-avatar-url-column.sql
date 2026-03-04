-- Add missing avatar_url column to public.users
-- Run this in Supabase SQL Editor

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Optional index
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON public.users (avatar_url);
