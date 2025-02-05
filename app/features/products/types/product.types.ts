import type { Session, SupabaseClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  retail_price: number;
  business_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  image_url: string | null;
  images?: ProductImage[];
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
  initialSession?: Session;
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
  tempImages?: TempImage[];
}

// Use the base props interface
export type ProductManagementProps = ProductManagementBaseProps;

export interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: ProductFormData;
  supabaseClient: SupabaseClient;
}

export interface ValidationErrors {
  name?: string;
  sku?: string;
  retail_price?: string;
  business_price?: string;
  stock?: string;
}
