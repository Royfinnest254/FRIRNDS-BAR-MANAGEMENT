-- Consolidated Supabase Schema for Bar Management System

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.daily_stock_records CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')) DEFAULT 'staff',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT products_name_check CHECK (name = upper(name))
);

-- 3. Inventory Table (Normalized stock)
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT inventory_product_unique UNIQUE (product_id)
);

-- 4. Sales Table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL, -- Keep name even if product is deleted
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('Cash', 'M-Pesa')),
    sales_person TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Daily Stock Records (For snapshots/reporting)
CREATE TABLE public.daily_stock_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    opening_stock INTEGER NOT NULL DEFAULT 0,
    added_stock INTEGER NOT NULL DEFAULT 0,
    closing_stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_daily_product UNIQUE (date, product_id)
);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stock_records ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Users can read their own profile, Admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: Everyone authenticated can view, only staff/admin can modify
CREATE POLICY "Authenticated can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/Admins can modify products" ON public.products FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Inventory: Same as products
CREATE POLICY "Authenticated can view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff/Admins can modify inventory" ON public.inventory FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Sales: Authenticated can view and insert, admins can delete
CREATE POLICY "Authenticated can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can record sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Daily Stock: Staff/Admins only
CREATE POLICY "Staff/Admins can manage daily stock" ON public.daily_stock_records FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- TRIGGER FOR AUTOMATED PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    CASE 
      WHEN new.email = 'roychumba16@gmail.com' THEN 'admin'
      ELSE 'staff'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INITIAL DATA SEEDING
INSERT INTO public.products (name, category, selling_price) VALUES
('TUSKER', 'Beer', 250),
('GUINNESS', 'Beer', 250),
('WHITE CAP', 'Beer', 250),
('BALOZI', 'Beer', 250),
('TUSKER CIDER', 'Beer', 250),
('SODA 500ML', 'Soft Drink', 100),
('SODA 300ML', 'Soft Drink', 80),
('HUNTERS 1/4', 'Spirit', 400),
('HUNTERS 1/2', 'Spirit', 750),
('HUNTERS 750ML', 'Spirit', 1500),
('VICEROY 1/4', 'Spirit', 450),
('VICEROY 1/2', 'Spirit', 850),
('VICEROY 750ML', 'Spirit', 1700),
('GILBEYS 1/4', 'Gin', 400),
('GILBEYS 1/2', 'Gin', 800),
('GILBEYS 750ML', 'Gin', 1600),
('SMIRNOFF VODKA 1/4', 'Vodka', 400),
('SMIRNOFF VODKA 1/2', 'Vodka', 800),
('CAPTAIN MORGAN 1/4', 'Rum', 450),
('BEST WHISKY 1/4', 'Whisky', 350),
('BEST WHISKY 750ML', 'Whisky', 1200),
('BEST GIN 1/4', 'Gin', 350),
('BEST GIN 750ML', 'Gin', 1200),
('COUNTY 1/4', 'Spirit', 200),
('COUNTY 750ML', 'Spirit', 1800),
('KIBAO 1/4', 'Spirit', 250),
('KIBAO 1/2', 'Spirit', 500),
('KIBAO 750ML', 'Spirit', 1000),
('BLACK & WHITE 1/2', 'Whisky', 850),
('BLACK & WHITE 750ML', 'Whisky', 1700),
('VAT 69 1/2', 'Whisky', 900),
('VAT 69 750ML', 'Whisky', 1800),
('CHROME 1/4', 'Spirit', 250),
('CHROME 750ML', 'Spirit', 900),
('KC 1/4', 'Spirit', 250),
('KC 1/2', 'Spirit', 500),
('KC 750ML', 'Spirit', 1000),
('DEL MONTE', 'Juice', 300),
('CAPRICE', 'Juice', 300),
('CASABUENA', 'Spirit', 300),
('GUARANA', 'Beer', 300),
('PUNCH CAN', 'Beer', 250),
('LEMONADE', 'Soft Drink', 150),
('BRAVADO ENERGY', 'Energy Drink', 200)
ON CONFLICT (name) DO NOTHING;

-- SEED INITIAL INVENTORY
INSERT INTO public.inventory (product_id, quantity)
SELECT id, 0 FROM public.products
ON CONFLICT (product_id) DO NOTHING;
