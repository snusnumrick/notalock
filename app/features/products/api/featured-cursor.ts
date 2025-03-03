import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { Database } from '~/features/supabase/types/Database.types';

type Tables = Database['public']['Tables'];

export interface CursorData {
  id: string;
  retail_price: number;
  name: string;
  created_at: string;
  featured: boolean;
}

export interface ProductWithCategories extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  retail_price: number;
  business_price: number;
  stock: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  featured: boolean;
  has_variants: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  product_categories: Array<{
    category: Pick<Tables['categories']['Row'], 'id' | 'name'> | null;
  }>;
}

export type ProductsQuery = PostgrestFilterBuilder<
  Database['public'],
  ProductWithCategories,
  ProductWithCategories[],
  'products',
  Database['public']['Tables']['products']['Relationships']
>;
