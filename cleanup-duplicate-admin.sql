-- Clean up duplicate admin user rows
-- Run this in Supabase SQL Editor

-- Step 1: Verify which row is the real admin (by auth user ID and email)
SELECT id, email, username, role, balance 
FROM public.users 
WHERE id = 'd1199f41-352f-448a-85dc-f4f895ea0098' 
   OR email = 'admin@example.com';

-- Step 2: Merge balance from duplicate into the real admin row
UPDATE public.users 
SET balance = balance + (
  SELECT COALESCE(balance, 0) 
  FROM public.users 
  WHERE email LIKE '%@internal.local' 
    AND id = 'd1199f41-352f-448a-85dc-f4f895ea0098'
  LIMIT 1
)
WHERE id = 'd1199f41-352f-448a-85dc-f4f895ea0098' 
  AND email = 'admin@example.com';

-- Step 3: Delete the internal.local duplicate row (if it exists)
DELETE FROM public.users 
WHERE email LIKE '%@internal.local' 
  AND id = 'd1199f41-352f-448a-85dc-f4f895ea0098';

-- Step 4: Ensure the correct admin row has proper values
UPDATE public.users 
SET 
  email = 'admin@example.com',
  role = 'admin',
  updated_at = NOW()
WHERE id = 'd1199f41-352f-448a-85dc-f4f895ea0098';

-- Step 5: Verify cleanup - should only show ONE row with admin@example.com
SELECT id, email, username, role, balance 
FROM public.users 
WHERE id = 'd1199f41-352f-448a-85dc-f4f895ea0098' 
   OR email = 'admin@example.com';
