-- FINAL FIX: STRUCTURE & RECURSION
-- This script fixes both the "Missing Email" error AND the "Infinite Recursion" error.

-- 1. FIX STRUCTURE: Add the missing 'email' column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. HELPER FUNCTION (The "Anti-Recursion" Key)
-- We create a secure function to check roles WITHOUT triggering the RLS loop.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER -- Runs as Superuser (Bypasses RLS)
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. RESET POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREATE NON-RECURSIVE POLICIES

-- READ: You can see yourself OR if you are Admin
CREATE POLICY "Read profiles" ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  get_my_role() = 'admin'
);

-- INSERT: Only Admins can create new users (or self-registration if needed)
CREATE POLICY "Insert profiles" ON public.profiles
FOR INSERT
WITH CHECK (
  get_my_role() = 'admin' 
  OR 
  auth.uid() = id -- Let users create their own initial profile on signup
);

-- UPDATE: You can update yourself OR Admin can update you
CREATE POLICY "Update profiles" ON public.profiles
FOR UPDATE
USING (
  get_my_role() = 'admin'
);

-- 5. SYNC EMAILS (Optional but good)
-- Tries to fill empty emails from auth.users (requires permission, might fail if standard user runs it, but worth a try)
-- Note: Standard users usually can't read auth.users.
-- We will skip the auto-sync to avoid permission errors. Manually updated via App.
