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

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { parentSlug, slug } = params;

  if (!parentSlug || !slug) {
    throw new Response('Category not found', { status: 404 });
  }

  // Find parent category for verification
  const parentCategory = findCategoryBySlug(parentSlug);

  if (!parentCategory) {
    throw new Response('Parent category not found', { status: 404 });
  }

  // Find the subcategory within the parent's children
  const category = findCategoryBySlug(slug);

  if (!category) {
    throw new Response('Subcategory not found', { status: 404 });
  }

  // Set up the URL with the category ID and use products loader
  const url = new URL(request.url);
  url.searchParams.set('categoryId', category.id);

  // Create a new request with the modified URL
  const modifiedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: request.method,
  });

  // Use the products loader to get products for this category
  const loaderData = await productsLoader({ request: modifiedRequest, params, context: {} });

  // Add the current category to the loader data for breadcrumbs
  return {
    ...loaderData,
    currentCategory: category,
  };
}

// Export component to render products for this subcategory
export default function SubCategoryProducts() {
  const loaderData = useLoaderData<{
    products: TransformedProduct[];
    total: number;
    nextCursor: string | null;
    initialLoad: boolean;
    filters: Record<string, string[]>;
    categories: Array<{ id: string; name: string }>;
    currentCategory?: Category;
  }>();

  console.log('SubCategoryProducts - loaderData:', {
    productCount: loaderData.products.length,
    currentCategory: loaderData.currentCategory,
  });

  // Instead of using dynamic require, let's reimplement the products component here
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
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col gap-6">
          <div className="sticky top-20 z-30 bg-white py-4 w-full shadow-sm border-b">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                  {loaderData.currentCategory?.name || 'Products'}
                </h1>
                <p className="text-sm text-gray-500">
                  Showing {allProducts.length} of {productTotal.current} products
                </p>
              </div>
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {!isMobile && (
              <aside className="md:w-64 shrink-0 md:sticky md:top-32 md:h-[calc(100vh-8rem)] md:overflow-y-auto">
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
                />
              ) : (
                <ProductList
                  products={allProducts}
                  nextCursor={loaderData.nextCursor}
                  isInitialLoad={loaderData.initialLoad}
                  total={productTotal.current}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
