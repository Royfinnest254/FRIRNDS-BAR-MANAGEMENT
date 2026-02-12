-- FIX MISSING PROFILES TABLE & RESTORE ADMIN
-- Run this to fix the "Profiles table missing" error.

-- 1. Create the table if it's missing
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')),
    full_name TEXT
);

-- 2. Enable Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Add Security Policy
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 4. RESTORE ADMIN (Specifically for roychumba16@gmail.com)
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', 'Super Admin'
FROM auth.users
WHERE email = 'roychumba16@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
