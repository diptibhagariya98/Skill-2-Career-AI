-- ============================================================================
-- ResuMentor Super Admin SQL Seed & Promotion Script
-- Run this directly in the Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Ensure the 'role' column exists in public.profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'student';
  END IF;
END $$;

-- 2. Promote an existing user to Admin by email
-- (Example 1: Primary Developer/Owner Account)
UPDATE public.profiles
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'max772750@gmail.com';

UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  ),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'max772750@gmail.com';

-- (Example 2: Dedicated Super Admin Account)
UPDATE public.profiles
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'superadmin@resumentor.app';

UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  ),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'superadmin@resumentor.app';

-- 3. Verification Query: View all current Admins
SELECT 
  p.id,
  p.email,
  p.name,
  p.role,
  p.updated_at,
  u.email_confirmed_at,
  u.raw_user_meta_data->>'role' AS auth_role
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin' OR u.raw_user_meta_data->>'role' = 'admin';
