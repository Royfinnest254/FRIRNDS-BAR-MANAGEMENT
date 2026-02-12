-- FIX PROFILES PERMISSIONS
-- This script gives ADMINS the power to Edit/Save other users.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. VIEW: Admins can see everyone.
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 2. INSERT: Admins can add new users
CREATE POLICY "Admins can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 3. UPDATE: Admins can change roles
CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 4. READ OWN: Everyone can read their own
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);
