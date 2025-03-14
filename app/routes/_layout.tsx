import { Outlet, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { getCategoryService } from '~/features/categories/api/categoryService.server';
import type { Category } from '~/features/categories/types/category.types';
import { buildCategoryTree, initializeCategories } from '~/data/categories';
import { Header } from '~/components/common/Header';
import { Footer } from '~/components/common/Footer';
// Cart provider is already in root.tsx

interface LoaderData {
  categories: Category[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();

  // Get category service
  const categoryService = getCategoryService(request, response);

  // Get all categories
  const allCategories = await categoryService.fetchCategories({
    isVisible: true,
  });

  // Log or debug category format if needed
  /*  console.log(
    `Loaded ${allCategories.length} categories, sample:`,
    allCategories.length > 0 ? JSON.stringify(allCategories[0], null, 2).substring(0, 300) : 'none'
  );*/

  // Build tree structure
  buildCategoryTree(allCategories);

  // Initialize the global categories array for backward compatibility
  initializeCategories(allCategories);

  return json<LoaderData>({ categories: allCategories }, { headers: response.headers });
};

/**
 * Main layout for public-facing pages
 */
export default function Layout() {
  const { categories } = useLoaderData<LoaderData>();
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header categories={categories} />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
