import type { Session, SupabaseClient } from '@supabase/supabase-js';

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  retail_price: number | null;
  business_price: number | null;
  stock: number | null;
  is_active: boolean | null;
  created_at: string;
  image_url: string | null;
  images?: ProductImage[];
  categories?: {
    id: string;
    name: string;
  }[];
}

export interface TransformedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  sku: string;
  stock: number;
  featured: boolean;
  created_at: string;
  hasVariants: boolean;
  categories: Array<{
    id: string;
    name: string;
  }>;
}

export interface LoaderData {
  session: Session | null;
  profile: { role: string } | null;
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  };
}

export interface ProductManagementBaseProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  profile?: { role: string };
  initialSession: Session | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string;
  file_name: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface TempImage {
  id: string; // Already using URL.createObjectURL(file) as ID
  url: string; // Can use previewUrl as url
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

export interface ProductFormData {
  id?: string;
  name: string;
  sku: string;
  description: string;
  retail_price: string;
  business_price: string;
  stock: string;
  is_active: boolean;
  image_url?: string | null;
  category_ids?: string[];
  tempImages?: TempImage[] | undefined;
}

export type ProductView = 'grid' | 'list';

// Use the base props interface
export type ProductManagementProps = ProductManagementBaseProps;

export interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: ProductFormData;
  supabaseClient: SupabaseClient;
}

export type ValidatedFields = 'name' | 'sku' | 'retail_price' | 'business_price' | 'stock';

export type ValidationErrors = {
  [K in ValidatedFields]?: string;
};

export type FormFields = ValidatedFields | 'description' | 'is_active';
