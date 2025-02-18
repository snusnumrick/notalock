import type { LoaderFunctionArgs } from '@remix-run/node';
import { getProducts } from './products.server';
import type { CustomerFilterOptions } from '../components/ProductFilter';
import { getCategories } from '~/features/categories/api/categories.server';

export async function productsLoader({ request }: LoaderFunctionArgs) {
  console.log('=== Products Loader ===');
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Number.isNaN(parseInt(url.searchParams.get('limit') || ''))
    ? 12
    : parseInt(url.searchParams.get('limit') || '12');

  // Parse customer filter parameters
  const filters: CustomerFilterOptions = {
    minPrice: url.searchParams.get('minPrice')
      ? Number.isNaN(parseFloat(url.searchParams.get('minPrice')!))
        ? undefined
        : parseFloat(url.searchParams.get('minPrice')!)
      : undefined,
    maxPrice: url.searchParams.get('maxPrice')
      ? Number.isNaN(parseFloat(url.searchParams.get('maxPrice')!))
        ? undefined
        : parseFloat(url.searchParams.get('maxPrice')!)
      : undefined,
    categoryId: url.searchParams.get('categoryId') || url.searchParams.get('category') || undefined,
    inStockOnly: url.searchParams.get('inStockOnly') === 'true',
    sortOrder:
      (url.searchParams.get('sortOrder') as CustomerFilterOptions['sortOrder']) || undefined,
  };

  // Fetch products and categories in parallel
  const [productsData, categories] = await Promise.all([
    getProducts({
      limit,
      cursor,
      filters,
      isAdmin: false,
    }),
    getCategories({ activeOnly: true }),
  ]);

  const { products, total, nextCursor } = productsData;

  return {
    products,
    total,
    nextCursor,
    initialLoad: !cursor,
    filters,
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
    })),
  };
}
