import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { createServerClient } from '@supabase/ssr';
import { ProductGallery } from '~/components/features/products/ProductGallery';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get: key => {
        const cookies = request.headers.get('Cookie') ?? '';
        const match = cookies.split(';').find(cookie => cookie.trim().startsWith(`${key}=`));
        return match ? match.split('=')[1] : null;
      },
      set: (key, value) => {
        response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
      },
      remove: key => {
        response.headers.append(
          'Set-Cookie',
          `${key}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
      },
    },
  });

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      images:product_images(*)
    `
    )
    .eq('id', params.id)
    .single();

  if (error || !product) {
    throw new Response('Product not found', { status: 404 });
  }

  return json({ product }, { headers: response.headers });
};

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Product Gallery */}
            <div>
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

              {/* Add to Cart Button - You can add this later */}
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
