-- Add missing profile columns to public.users
-- Run this in Supabase SQL Editor

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS what_i_sell text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS language text;

-- Optional index
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON public.users (avatar_url);
