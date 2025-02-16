import { getSupabase } from '~/lib/supabase';
import type { Product } from '../types/product.types';

export async function getProducts({
  page = 1,
  limit = 12,
  categoryId = null,
}: {
  page?: number;
  limit?: number;
  categoryId?: string | null;
} = {}) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      description,
      retail_price,
      business_price,
      image_url,
      sku,
      stock,
      is_active,
      featured,
      categories:product_categories!left(
        category:categories(
          id,
          name
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('is_active', true);

  if (categoryId) {
    query = query.eq('product_categories.category_id', categoryId);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch products from database');
  }

  if (!data) {
    return {
      products: [],
      total: 0,
    };
  }

  const products = data.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.retail_price,
    thumbnailUrl: product.image_url,
    sku: product.sku,
    categories: product.categories
      .map(cp => ({
        id: cp.category.id,
        name: cp.category.name,
      }))
      .filter(category => category.id && category.name),
  }));

  return {
    products,
    total: count || 0,
  };
}
