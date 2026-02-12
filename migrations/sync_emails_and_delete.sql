-- SYNC EMAILS & ADD DELETE FUNCTION
-- Run this to fix "No Email" and allow Deleting Users

-- 1. Sync Emails and Dates from Auth to Profiles
-- This fills in the missing data in your table
UPDATE public.profiles p
SET 
  email = u.email,
  created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id;

-- 2. Create Secure Delete Function
-- Allows Admin to delete a user from the Database (Auth + Profile)
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict check: Only Admin can run this
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete from profiles (Cascades usually, but let's be safe)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (The important part)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
