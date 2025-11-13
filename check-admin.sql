-- Quick check - run this in Supabase SQL Editor
-- This will show ALL users and their roles

SELECT 
  id, 
  email, 
  username, 
  role, 
  balance,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- Also check what email you're logged in with in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
