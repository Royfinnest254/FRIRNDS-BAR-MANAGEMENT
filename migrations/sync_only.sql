-- FIX & SYNC
-- 1. Add the missing 'created_at' column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

-- 2. Sync the data from Auth
UPDATE public.profiles p
SET 
  email = u.email,
  created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id;
