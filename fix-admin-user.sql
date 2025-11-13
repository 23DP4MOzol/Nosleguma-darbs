-- =====================================
-- FIX ADMIN USER SCRIPT
-- =====================================
-- Run this in your Supabase SQL Editor

-- Step 1: Check your current auth user ID
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Step 2: Check if user exists in public.users table
SELECT id, email, role FROM public.users WHERE email = 'admin@example.com';

-- Step 3: If the user exists but role is not 'admin', update it:
-- (Replace 'your-auth-user-id-here' with the actual ID from Step 1)
-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE id = 'your-auth-user-id-here';

-- Step 4: If the user doesn't exist in public.users, create it:
-- (Replace 'your-auth-user-id-here' with the actual ID from Step 1)
-- INSERT INTO public.users (id, email, username, role, balance)
-- VALUES (
--   'your-auth-user-id-here',
--   'admin@example.com',
--   'Admin',
--   'admin',
--   1000.00
-- );

-- Step 5: Verify the fix
SELECT id, email, username, role, balance FROM public.users WHERE email = 'admin@example.com';

-- ALTERNATIVE: Set role to admin for your currently logged in account
-- Find your user email and update it:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-actual-email@example.com';
