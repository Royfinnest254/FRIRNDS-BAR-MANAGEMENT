-- CHUNK 3: POLICIES & DATA
-- RUN THIS THIRD

-- 1. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- Profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Products (Read Only for all authenticated, Admin manages)
CREATE POLICY "Everyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated can select products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Inventory
CREATE POLICY "Everyone can view inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Authenticated can update inventory" ON public.inventory FOR ALL USING (auth.role() = 'authenticated');

-- Daily Stock
CREATE POLICY "Everyone can view daily stock" ON public.daily_stock_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage daily stock" ON public.daily_stock_records FOR ALL USING (auth.role() = 'authenticated');

-- 3. Insert Master Data
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

-- 4. Initialize Inventory
INSERT INTO public.inventory (product_id, quantity)
SELECT id, 0 FROM public.products
WHERE id NOT IN (SELECT product_id FROM public.inventory);
