import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import type { Category } from '~/features/categories/types/category.types';
import { Suspense } from 'react';
import { categoryLoader } from '~/features/categories/api/loaders';

export const meta: MetaFunction = () => {
  return [
    { title: 'Product Categories - Notalock' },
    {
      name: 'description',
      content: 'Browse our comprehensive selection of high-quality door hardware categories.',
    },
  ];
};

interface LoaderData {
  categories: Category[];
}

export const loader: LoaderFunction = async ({ request, params, context }) => {
  return categoryLoader({ request, params, context });
};

export default function CategoriesPage() {
  const { categories } = useLoaderData<LoaderData>();

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Product Categories
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our extensive collection of premium door hardware solutions by category.
          </p>
        </div>

        {/* Page Under Construction Notice */}
        <div className="rounded-lg bg-blue-50 p-6 mb-12 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center space-x-4">
            <svg
              className="h-10 w-10 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-blue-800">Under Construction</h3>
              <p className="mt-1 text-sm text-blue-700">
                We&apos;re enhancing our category browsing experience. This page is currently under
                development.
              </p>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <Suspense fallback={<div>Loading categories...</div>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => (
              <div
                key={category.id}
                className="group relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                  {/* Category doesn't have imageUrl property, so use placeholder */}
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-1">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    Browse Products
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Suspense>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No categories found</h3>
            <p className="mt-1 text-gray-500">
              We&apos;re currently updating our product categories. Please check back soon.
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    </div>
  );
}
