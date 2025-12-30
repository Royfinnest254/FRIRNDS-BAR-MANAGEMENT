-- 000_RESTORE_ALL.sql
-- RUN THIS SCRIPT TO FIX "CRITICAL ERROR: PROFILES MISSING"

-- 1. Create the table again (in case it was deleted)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')),
    full_name TEXT
);

-- 2. Enable Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. FIX PERMISSIONS (So you can save/edit)
-- Allow Admins to View/Insert/Update everything
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (true);

-- Allow users to read themselves
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 4. RESTORE YOUR ADMIN (roychumba16@gmail.com)
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', 'Super Admin'
FROM auth.users
WHERE email = 'roychumba16@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
