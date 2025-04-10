import type { Session, SupabaseClient } from '@supabase/supabase-js';

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  retail_price: number | null;
  image_url: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name?: string; // Making this optional since it might not exist in all variants
  type?: string; // e.g., 'color', 'size', 'material'
  sku?: string | null;
  price_adjustment?: number; // Added or subtracted from base price
  retail_price?: number | null;
  business_price?: number | null;
  stock?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  retail_price: number | null;
  business_price: number | null;
  stock: number | null;
  is_active: boolean | null;
  created_at: string | null;
  image_url: string | null;
  alt_text?: string | null;
  manufacturer?: string | null;
  category_id?: string | null;
  images?: ProductImage[];
  categories?: {
    id: string;
    name: string;
  }[];
}

export interface TransformedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  alt_text?: string | null;
  sku: string | null;
  stock: number;
  featured: boolean;
  created_at: string | null;
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
  product_id: string | null;
  url: string;
  storage_path: string;
  file_name: string;
  is_primary: boolean | null;
  sort_order: number | null;
  alt_text?: string | null;
  updated_by?: string | null;
  created_at: string | null;
  updated_at?: string | null;
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
  slug?: string;
  sku: string | null;
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

export type FormFields = ValidatedFields | 'description' | 'is_active' | 'slug';
