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
  category_id: string | null;
  category?: { id: string; name: string };
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
  tempImages?: TempImage[] | undefined;
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

export type ValidatedFields = 'name' | 'sku' | 'retail_price' | 'business_price' | 'stock';

export type ValidationErrors = {
  [K in ValidatedFields]?: string;
};

export type FormFields = ValidatedFields | 'description' | 'is_active';
