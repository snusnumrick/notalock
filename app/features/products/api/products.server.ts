import { getSupabase } from '~/lib/supabase';
import type { Product } from '../types/product.types';
import type { FilterOptions } from '../components/ProductSearch';
import type { CustomerFilterOptions } from '../components/ProductFilter';

export async function getProducts({
  page = 1,
  limit = 12,
  categoryId = null,
  filters = {},
  isAdmin = false,
}: {
  page?: number;
  limit?: number;
  categoryId?: string | null;
  filters?: FilterOptions | CustomerFilterOptions;
  isAdmin?: boolean;
} = {}) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase.from('products').select(
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
      categories:product_categories!left(
        category:categories(
          id,
          name
        )
      )
    `,
    { count: 'exact' }
  );

  // Always filter for active products in customer view
  if (!isAdmin) {
    query = query.eq('is_active', true);
  }

  if (isAdmin) {
    // Admin-specific filters
    const adminFilters = filters as FilterOptions;

    if (adminFilters.search) {
      query = query.ilike('name', `%${adminFilters.search}%`);
    }

    if (adminFilters.minPrice !== undefined) {
      query = query.gte('retail_price', adminFilters.minPrice);
    }

    if (adminFilters.maxPrice !== undefined) {
      query = query.lte('retail_price', adminFilters.maxPrice);
    }

    if (adminFilters.minStock !== undefined) {
      query = query.gte('stock', adminFilters.minStock);
    }

    if (adminFilters.maxStock !== undefined) {
      query = query.lte('stock', adminFilters.maxStock);
    }

    if (adminFilters.isActive !== undefined) {
      query = query.eq('is_active', adminFilters.isActive);
    }

    if (adminFilters.hasVariants !== undefined) {
      try {
        query = query.eq('has_variants', adminFilters.hasVariants);
      } catch (error) {
        console.warn('has_variants column not available yet, skipping filter');
      }
    }

    if (adminFilters.sortBy) {
      const sortField = {
        name: 'name',
        price: 'retail_price',
        stock: 'stock',
        created: 'created_at',
      }[adminFilters.sortBy];

      if (sortField) {
        query = query.order(sortField, {
          ascending: adminFilters.sortOrder === 'asc',
        });
      }
    }
  } else {
    // Customer-specific filters
    const customerFilters = filters as CustomerFilterOptions;

    if (customerFilters.minPrice !== undefined) {
      query = query.gte('retail_price', customerFilters.minPrice);
    }

    if (customerFilters.maxPrice !== undefined) {
      query = query.lte('retail_price', customerFilters.maxPrice);
    }

    if (customerFilters.inStockOnly) {
      query = query.gt('stock', 0);
    }

    // Apply sorting
    switch (customerFilters.sortOrder) {
      case 'price_asc':
        query = query.order('retail_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('retail_price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'featured':
      default:
        // Default sorting for customer view
        query = query
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });
        break;
    }
  }

  // Common category filter
  if (categoryId || (filters as CustomerFilterOptions).categoryId) {
    const catId = categoryId || (filters as CustomerFilterOptions).categoryId;
    query = query.eq('product_categories.category_id', catId);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

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
    stock: product.stock,
    hasVariants: product.has_variants ?? false,
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
