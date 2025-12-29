-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DATA RESET: Drop existing tables to fix schema mismatches
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.daily_stock_records CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;

-- 1. Inventory Table
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price NUMERIC NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Daily Stock Records Table
CREATE TABLE public.daily_stock_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    item_name TEXT NOT NULL,
    open_stock INTEGER NOT NULL DEFAULT 0,
    added_stock INTEGER NOT NULL DEFAULT 0,
    closing_stock INTEGER NOT NULL DEFAULT 0,
    price NUMERIC NOT NULL DEFAULT 0,
    profit_margin NUMERIC,
    daily_sale_amount NUMERIC NOT NULL DEFAULT 0,
    sales_person TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Sales Table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    payment TEXT CHECK (payment IN ('Cash', 'M-Pesa'))
);

-- Create simple indexes for common queries
CREATE INDEX idx_inventory_item_name ON public.inventory(item_name);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_daily_stock_date ON public.daily_stock_records(date);
