-- CHUNK 1: CLEANUP & PRODUCTS TABLE
-- RUN THIS FIRST

-- 1. Drop old tables
DROP TABLE IF EXISTS public.daily_stock_records CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE; 
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Create Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add Constraint
ALTER TABLE public.products ADD CONSTRAINT products_name_check CHECK (name = upper(name));
