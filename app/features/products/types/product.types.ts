import type { Session } from '@supabase/supabase-js';

export interface ProductFormData {
    name: string;
    sku: string;
    description: string;
    retail_price: string;
    business_price: string;
    stock: string;
    is_active: boolean;
    files?: FileList | null;
}

export interface ValidationErrors {
    [key: string]: string;
}

export interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: ProductFormData) => Promise<void>;
    initialData?: Partial<ProductFormData>;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    description: string | null;
    retail_price: number;
    business_price: number;
    stock: number;
    is_active: boolean;
    created_at: string;
    product_images: ProductImage[];
}

export interface ProductImage {
    id: number;
    product_id: number;
    url: string;
    is_primary: boolean;
    created_at: string;
}

export interface LoaderData {
    session: Session | null;
    profile: { role: string } | null;
    env: {
        SUPABASE_URL: string;
        SUPABASE_ANON_KEY: string;
    };
}

export interface ProductManagementProps {
    supabaseUrl: string;
    supabaseAnonKey: string;
}