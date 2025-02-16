import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import { useState } from 'react';
import { ProductGrid } from '~/features/products/components/ProductGrid';
import { ProductList } from '~/features/products/components/ProductList';
import { ViewToggle } from '~/features/products/components/ViewToggle';
import type { Product, ProductView } from '~/features/products/types/product.types';
import { productsLoader } from '~/features/products/api/loaders';

export const loader: LoaderFunction = async ({ request }) => {
  return productsLoader({ request });
};

export default function Products() {
  const { products, total, currentPage, totalPages } = useLoaderData<{
    products: Product[];
    total: number;
    currentPage: number;
    totalPages: number;
  }>();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ProductView>('grid');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-gray-500">
            Showing {products.length} of {total} products
          </p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {products.length > 0 ? (
        view === 'grid' ? (
          <ProductGrid products={products} />
        ) : (
          <ProductList products={products} />
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
}
