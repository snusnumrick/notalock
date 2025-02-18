import { getSupabase } from '~/lib/supabase';
import type { CustomerFilterOptions } from '../components/ProductFilter';
import type { FilterOptions } from '../components/ProductSearch';

interface GetProductsOptions {
  limit?: number;
  cursor?: string;
  categoryId?: string | null;
  filters?: FilterOptions | CustomerFilterOptions;
  isAdmin?: boolean;
}

interface CursorData {
  id: string;
  retail_price: number | null;
  name: string;
  created_at: string;
  featured?: boolean;
}

export async function getProducts({
  limit = 12,
  cursor,
  categoryId = null,
  filters = {},
  isAdmin = false,
}: GetProductsOptions) {
  const supabase = getSupabase();
  console.log('=== getProducts ===');
  console.log('Limit:', limit);
  console.log('Incoming cursor:', cursor);

  // Get total count of active products (separate query)
  const totalQuery = supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('is_active', true);

  // Build products query
  let productsQuery = supabase
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
      has_variants,
      created_at,
      categories:product_categories(
        category:categories(
          id,
          name
        )
      )
    `
    )
    .eq('is_active', true);

  // Apply cursor-based pagination
  let decodedCursor: CursorData | null = null;
  if (cursor) {
    try {
      decodedCursor = JSON.parse(atob(cursor));
      console.log('Decoded cursor:', decodedCursor);
      productsQuery = productsQuery.gt('id', decodedCursor.id);
    } catch (error) {
      console.error('Error parsing cursor:', error);
    }
  }

  // Apply customer filters
  const customerFilters = filters as CustomerFilterOptions;
  if (customerFilters.minPrice !== undefined) {
    productsQuery = productsQuery.gte('retail_price', customerFilters.minPrice);
    totalQuery.gte('retail_price', customerFilters.minPrice);
  }

  if (customerFilters.maxPrice !== undefined) {
    productsQuery = productsQuery.lte('retail_price', customerFilters.maxPrice);
    totalQuery.lte('retail_price', customerFilters.maxPrice);
  }

  if (customerFilters.inStockOnly) {
    productsQuery = productsQuery.gt('stock', 0);
    totalQuery.gt('stock', 0);
  }

  // Common category filter
  if (categoryId || customerFilters.categoryId) {
    const catId = categoryId || customerFilters.categoryId;
    productsQuery = productsQuery.eq('categories.category.id', catId);
    totalQuery.eq('categories.category.id', catId);
  }

  // Always add base ordering
  productsQuery = productsQuery.order('id');

  // Apply customer sorting
  switch (customerFilters.sortOrder) {
    case 'price_asc':
      productsQuery = productsQuery.order('retail_price', { ascending: true });
      break;
    case 'price_desc':
      productsQuery = productsQuery.order('retail_price', { ascending: false });
      break;
    case 'newest':
      productsQuery = productsQuery.order('created_at', { ascending: false });
      break;
    case 'featured':
    default:
      productsQuery = productsQuery
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
      break;
  }

  // Apply limit last
  productsQuery = productsQuery.limit(limit);

  // Execute both queries in parallel
  const [productsResponse, totalResponse] = await Promise.all([productsQuery, totalQuery]);

  if (productsResponse.error) {
    console.error('Error fetching products:', productsResponse.error);
    throw new Error('Failed to fetch products');
  }

  if (totalResponse.error) {
    console.error('Error fetching total count:', totalResponse.error);
    throw new Error('Failed to fetch total count');
  }

  const products =
    productsResponse.data?.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.retail_price || 0,
      image_url: product.image_url,
      sku: product.sku,
      stock: product.stock,
      featured: product.featured,
      created_at: product.created_at,
      hasVariants: product.has_variants ?? false,
      categories: (product.categories || [])
        .map(cp =>
          cp?.category
            ? {
                id: cp.category.id,
                name: cp.category.name,
              }
            : null
        )
        .filter(Boolean),
    })) || [];

  // Generate next cursor only if we might have more products
  let nextCursor = null;
  if (products.length === limit && products.length > 0) {
    const lastProduct = products[products.length - 1];
    const cursorData: CursorData = {
      id: lastProduct.id,
      retail_price: lastProduct.price,
      name: lastProduct.name,
      created_at: lastProduct.created_at,
      featured: lastProduct.featured,
    };
    nextCursor = btoa(JSON.stringify(cursorData));
  }

  console.log('Products fetched:', products.length);
  console.log('First product ID:', products[0]?.id);
  console.log('Last product ID:', products[products.length - 1]?.id);
  console.log('Total products:', totalResponse.count);
  console.log('Next cursor:', nextCursor);
  console.log('=== End getProducts ===');

  return {
    products,
    total: totalResponse.count || 0,
    nextCursor,
  };
}
