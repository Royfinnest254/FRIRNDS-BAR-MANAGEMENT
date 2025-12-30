CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    product_id UUID REFERENCES public.products(id),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('Cash', 'M-Pesa')),
    sales_person TEXT
);
