import { type LoaderFunctionArgs, type TypedResponse } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { createSupabaseClient } from '~/server/middleware/supabase.server';
import type { Product, ProductImage } from '~/features/products/types/product.types';
import ProductGallery from '~/features/products/components/ProductGallery';

interface LoaderData {
  product: Product & { images: ProductImage[] };
}

export const loader = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<TypedResponse<LoaderData>> => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      images:product_images(*)
    `
    )
    .eq('id', params.id)
    .order('sort_order', { referencedTable: 'product_images' })
    .single();

  if (error || !product) {
    throw new Response('Product not found', { status: 404 });
  }

  return new Response(JSON.stringify({ product }), {
    headers: {
      ...response.headers,
      'Content-Type': 'application/json',
    },
  });
};

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Product Gallery */}
            <div className="w-full">
              <ProductGallery images={product.images} />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h2 className="text-lg font-medium text-gray-900">Description</h2>
                <p className="mt-2 text-gray-600">{product.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-medium text-gray-900">Retail Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${product.retail_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-gray-900">Stock</p>
                    <p className="text-lg text-gray-600">{product.stock} available</p>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                         focus:ring-blue-500"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
