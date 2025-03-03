import { Link, useRouteLoaderData } from '@remix-run/react';
import type { Category } from '../types/category.types';

interface CategoryNavigationProps {
  className?: string;
}

/**
 * Navigation component that displays categories from the route loader data
 * Uses categories loaded from the database via productsLoader
 */
export function CategoryNavigation({ className = '' }: CategoryNavigationProps) {
  // Get categories from the products route loader
  const loaderData = (useRouteLoaderData('routes/products') as { categories?: Category[] }) || {};
  const { categories = [] } = loaderData;

  if (categories.length === 0) {
    return null;
  }

  return (
    <nav className={`category-navigation ${className}`}>
      <ul className="space-y-1">
        {categories.map(category => (
          <li key={category.id}>
            <Link
              to={`/products/category/${category.slug}`}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Example usage:
 *
 * import { CategoryNavigation } from '~/features/categories/components/CategoryNavigation';
 *
 * export default function Layout() {
 *   return (
 *     <div className="flex">
 *       <aside className="w-64 border-r">
 *         <CategoryNavigation className="py-4" />
 *       </aside>
 *       <main className="flex-1">
 *         <Outlet />
 *       </main>
 *     </div>
 *   );
 * }
 */
