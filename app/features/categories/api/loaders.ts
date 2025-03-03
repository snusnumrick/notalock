import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { getCategoryService } from './categoryService.server';
import { getCategoriesWithCache } from '~/data/categories';

/**
 * Loader for fetching categories with optional filtering
 */
export async function categoryLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const highlighted = url.searchParams.get('highlighted') === 'true';
  const response = new Response();

  // Get the category service
  const categoryService = getCategoryService(request, response);

  try {
    let categories;
    if (highlighted) {
      // If highlighted parameter is true, fetch highlighted categories only
      categories = await categoryService.fetchHighlightedCategories();
    } else {
      // Otherwise fetch all categories that should be visible
      categories = await categoryService.fetchCategories({
        isVisible: true,
      });
    }

    return json({ categories });
  } catch (error) {
    console.error('Error loading categories:', error);
    return json({ categories: [], error: 'Failed to load categories' }, { status: 500 });
  }
}

/**
 * Loader for fetching categories in hierarchical tree structure
 */
export async function categoryTreeLoader({ request }: LoaderFunctionArgs) {
  try {
    // Use the cached version for better performance
    const categories = await getCategoriesWithCache(request, { includeChildren: true });
    return json({ categories });
  } catch (error) {
    console.error('Error loading category tree:', error);
    return json({ categories: [], error: 'Failed to load category tree' }, { status: 500 });
  }
}

/**
 * Example usage in a route:
 *
 * import { categoryLoader } from '~/features/categories/api/loaders';
 *
 * export const loader = async ({ request }: LoaderFunctionArgs) => {
 *   return categoryLoader({ request });
 * };
 *
 * export default function CategoriesPage() {
 *   const { categories } = useLoaderData<typeof loader>();
 *   return (
 *     // Render categories
 *   );
 * }
 */
