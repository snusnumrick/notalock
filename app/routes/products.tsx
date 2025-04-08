import type { MetaFunction } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { json, LoaderFunction } from '@remix-run/node';
import { Header } from '~/components/common/Header';
import { getCategoryService } from '~/features/categories/api/categoryService.server';
import type { Category } from '~/features/categories/types/category.types';
import { buildCategoryTree, initializeCategories } from '~/data/categories';

export const meta: MetaFunction = () => {
  return [
    { title: 'Products - Notalock' },
    { name: 'description', content: 'Browse our collection of European door hardware' },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();

  // Get category service
  const categoryService = getCategoryService(request, response);

  // Get all categories
  const allCategories = await categoryService.fetchCategories({
    isVisible: true,
  });

  // Build tree structure
  buildCategoryTree(allCategories);

  // Initialize the global categories array for backward compatibility
  initializeCategories(allCategories);

  return json({ categories: allCategories }, { headers: response.headers });
};

export default function ProductsLayout() {
  const { categories } = useLoaderData<{ categories: Category[] }>();
  console.log(
    'ProductsLayout rendering with route:',
    typeof window !== 'undefined' ? window.location.pathname : 'server-side'
  );
  return (
    <div className="bg-page-bg flex-grow">
      <Header categories={categories} />
      <main className="pt-28">
        <Outlet />
      </main>
    </div>
  );
}
