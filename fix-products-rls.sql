-- =====================================
-- FIX PRODUCTS RLS POLICY
-- =====================================
-- Run this in your Supabase SQL Editor
-- This allows public read access to products (for browsing)

-- Enable RLS on products table (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or not) to view products
CREATE POLICY "Public can view products" ON products
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert products
CREATE POLICY "Users can insert products" ON products
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Allow users to update their own products
CREATE POLICY "Users can update own products" ON products
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- Allow users to delete their own products
CREATE POLICY "Users can delete own products" ON products
  FOR DELETE
  USING (auth.uid() = seller_id);

-- Verify the policies
SELECT policyname, tablename, operation, roles
FROM pg_policies
WHERE tablename = 'products';
