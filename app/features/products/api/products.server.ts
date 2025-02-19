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
  /*console.log('=== getProducts ===', {
    limit,
    cursor,
    categoryId,
    filters,
    isAdmin,
  });*/

  // Build base query for products with categories
  let productsQuery = supabase
    .from('products')
    .select(
      `
      *,
      product_categories(category:categories(*))
    `,
      { count: 'exact' }
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
  if (!isAdmin) {
    const customerFilters = filters as CustomerFilterOptions;
    if (customerFilters.minPrice !== undefined) {
      productsQuery = productsQuery.gte('retail_price', customerFilters.minPrice);
    }

    if (customerFilters.maxPrice !== undefined) {
      productsQuery = productsQuery.lte('retail_price', customerFilters.maxPrice);
    }

    if (customerFilters.inStockOnly) {
      productsQuery = productsQuery.gt('stock', 0);
    }

    if (categoryId || customerFilters.categoryId) {
      const catId = categoryId || customerFilters.categoryId;
      // Create a new query with inner joins for category filtering
      productsQuery = supabase
        .from('products')
        .select(
          `
          *,
          product_categories!inner(category:categories!inner(*))
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .eq('product_categories.category_id', catId);

      // Reapply cursor if it exists
      if (decodedCursor) {
        productsQuery = productsQuery.gt('id', decodedCursor.id);
      }

      // Reapply other filters
      if (customerFilters.minPrice !== undefined) {
        productsQuery = productsQuery.gte('retail_price', customerFilters.minPrice);
      }
      if (customerFilters.maxPrice !== undefined) {
        productsQuery = productsQuery.lte('retail_price', customerFilters.maxPrice);
      }
      if (customerFilters.inStockOnly) {
        productsQuery = productsQuery.gt('stock', 0);
      }
    }

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
  } else {
    // Apply admin filters
    const adminFilters = filters as FilterOptions;
    if (adminFilters.search) {
      productsQuery = productsQuery.ilike('name', `%${adminFilters.search}%`);
      totalQuery.ilike('name', `%${adminFilters.search}%`);
    }

    if (adminFilters.minPrice !== undefined) {
      productsQuery = productsQuery.gte('retail_price', adminFilters.minPrice);
      totalQuery.gte('retail_price', adminFilters.minPrice);
    }

    if (adminFilters.maxPrice !== undefined) {
      productsQuery = productsQuery.lte('retail_price', adminFilters.maxPrice);
      totalQuery.lte('retail_price', adminFilters.maxPrice);
    }

    if (adminFilters.minStock !== undefined) {
      productsQuery = productsQuery.gte('stock', adminFilters.minStock);
      totalQuery.gte('stock', adminFilters.minStock);
    }

    if (adminFilters.maxStock !== undefined) {
      productsQuery = productsQuery.lte('stock', adminFilters.maxStock);
      totalQuery.lte('stock', adminFilters.maxStock);
    }

    if (adminFilters.isActive !== undefined) {
      productsQuery = productsQuery.eq('is_active', adminFilters.isActive);
      totalQuery.eq('is_active', adminFilters.isActive);
    }

    if (adminFilters.hasVariants !== undefined) {
      productsQuery = productsQuery.eq('has_variants', adminFilters.hasVariants);
      totalQuery.eq('has_variants', adminFilters.hasVariants);
    }

    // Apply admin sorting
    if (adminFilters.sortBy) {
      const ascending = adminFilters.sortOrder !== 'desc';
      switch (adminFilters.sortBy) {
        case 'name':
          productsQuery = productsQuery.order('name', { ascending });
          break;
        case 'price':
          productsQuery = productsQuery.order('retail_price', { ascending });
          break;
        case 'stock':
          productsQuery = productsQuery.order('stock', { ascending });
          break;
        case 'created':
          productsQuery = productsQuery.order('created_at', { ascending });
          break;
      }
    }
  }

  // Always add base ordering
  productsQuery = productsQuery.order('id');

  // Apply limit last
  productsQuery = productsQuery.limit(limit);

  // Execute query
  const productsResponse = await productsQuery;

  if (productsResponse.error) {
    console.error('Error fetching products:', productsResponse.error);
    throw new Error('Failed to fetch products');
  }

  // Map response
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
      categories: (product.product_categories || [])
        .map(pc =>
          pc?.category
            ? {
                id: pc.category.id,
                name: pc.category.name,
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

  return {
    products,
    total: productsResponse.count || 0,
    nextCursor,
  };
}
