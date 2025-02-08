-- Create product_options table for variant options like "Size", "Color", etc.
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create product_option_values table for option values like "Small", "Red", etc.
CREATE TABLE IF NOT EXISTS public.product_option_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(option_id, value)
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    retail_price DECIMAL(10, 2),
    business_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create product_variant_options table to store which option values apply to each variant
CREATE TABLE IF NOT EXISTS public.product_variant_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES public.product_option_values(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(variant_id, option_value_id)
);

-- Enable RLS and add policies for all new tables
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_options ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public Read Access" ON public.product_options FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.product_option_values FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.product_variant_options FOR SELECT USING (true);

-- Admin write access policies
CREATE POLICY "Admin Write Access" ON public.product_options
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin Write Access" ON public.product_option_values
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin Write Access" ON public.product_variants
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin Write Access" ON public.product_variant_options
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Insert some common product options
INSERT INTO public.product_options (name) VALUES 
    ('Size'),
    ('Color')
ON CONFLICT DO NOTHING;