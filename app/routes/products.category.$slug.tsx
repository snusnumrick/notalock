import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link, useSearchParams } from '@remix-run/react';
import { findCategoryBySlug } from '~/features/categories/utils/categoryUtils';
import { ProductView, TransformedProduct } from '~/features/products/types/product.types';
import { productsLoader } from '~/features/products/api/loaders';
import { Category } from '~/features/categories/types/category.types';
import { useState, useRef } from 'react';
import { ProductGrid } from '~/features/products/components/ProductGrid';
import { ProductList } from '~/features/products/components/ProductList';
import { ViewToggle } from '~/features/products/components/ViewToggle';
import ProductFilter from '~/features/products/components/ProductFilter';
import { useMediaQuery } from '~/hooks/useMediaQuery';
import { ChevronRight } from 'lucide-react';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { slug } = params;
  // console.log('Loading category page for slug:', slug);

  if (!slug) {
    throw new Response('Category not found', { status: 404 });
  }

  const category = findCategoryBySlug(slug);
  // console.log('Found category:', category);

  if (!category) {
    throw new Response('Category not found', { status: 404 });
  }

  // Instead of redirecting, we'll set up a new URL with the category ID
  // and then pass that to the products loader
  const url = new URL(request.url);
  url.searchParams.set('categoryId', category.id);
  console.log('Setting categoryId in URL:', category.id);

  // Create a new request with the modified URL
  const modifiedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: request.method,
  });

  // Use the products loader to get products for this category
  const loaderData = await productsLoader({ request: modifiedRequest, params, context: {} });
  // console.log('Loaded products count:', loaderData.products.length);

  // Add the current category to the loader data for breadcrumbs
  return {
    ...loaderData,
    currentCategory: category,
  };
}

// Export the component to render the products page with the category filter
export default function CategoryProducts() {
  const loaderData = useLoaderData<{
    products: TransformedProduct[];
    total: number;
    nextCursor: string | null;
    initialLoad: boolean;
    filters: Record<string, string[]>;
    categories: Array<{ id: string; name: string }>;
    currentCategory?: Category;
  }>();

  console.log('CategoryProducts - loaderData:', {
    productCount: loaderData.products.length,
    currentCategory: loaderData.currentCategory,
  });

  // Instead of using dynamic require, let's reimplement the products component here
  // to avoid any potential issues with dynamic imports
  const [view, setView] = useState<ProductView>('grid');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [searchParams, setSearchParams] = useSearchParams();
  const allProducts = loaderData.products;
  const productTotal = useRef(loaderData.total);

  if (loaderData.products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No products found in this category</h2>
          <p className="text-gray-600 mb-8">Try browsing other categories or check back later.</p>
          <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to all products
          </Link>
        </div>
      </div>
    );
  }

  // Similar to Products component but simplified
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-2 relative">
        <div className="flex flex-col gap-6">
          <div className="sticky top-28 z-30 bg-white py-4 w-full shadow-sm border-b">
            <div className="flex flex-col gap-2">
              {/* Integrated breadcrumbs + title */}
              <div className="flex items-baseline flex-wrap gap-2">
                <Link
                  to="/"
                  className="text-gray-500 text-sm hover:text-blue-600 transition-colors duration-200"
                >
                  Home
                </Link>
                <ChevronRight className="h-3 w-3 text-gray-400" />
                <Link
                  to="/products"
                  className="text-gray-500 text-sm hover:text-blue-600 transition-colors duration-200"
                >
                  Products
                </Link>
                <ChevronRight className="h-3 w-3 text-gray-400" />
                <h1 className="text-2xl font-bold">
                  {loaderData.currentCategory?.name || 'Products'}
                </h1>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Showing {allProducts.length} of {productTotal.current} products
                </p>
                <ViewToggle view={view} onViewChange={setView} />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {!isMobile && (
              <aside className="md:w-64 shrink-0 md:sticky md:top-40 md:h-[calc(100vh-10rem)] md:overflow-y-auto">
                <ProductFilter
                  onFilterChange={() => {}}
                  defaultFilters={loaderData.filters}
                  categories={loaderData.categories}
                />
              </aside>
            )}

            <main className="flex-1 relative" style={{ zIndex: 1 }} data-testid="product-grid">
              {view === 'grid' ? (
                <ProductGrid
                  products={allProducts}
                  nextCursor={loaderData.nextCursor}
                  isInitialLoad={loaderData.initialLoad}
                  total={productTotal.current}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  currentCategory={loaderData.currentCategory}
                />
              ) : (
                <ProductList
                  products={allProducts}
                  nextCursor={loaderData.nextCursor}
                  isInitialLoad={loaderData.initialLoad}
                  total={productTotal.current}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                  currentCategory={loaderData.currentCategory}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
