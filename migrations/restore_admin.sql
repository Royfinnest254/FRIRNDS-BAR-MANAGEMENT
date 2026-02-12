-- TARGETED ADMIN RESTORE
-- This script looks for 'roychumba16@gmail.com' and makes them Admin.

INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', 'Admin User'
FROM auth.users
WHERE email = 'roychumba16@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
