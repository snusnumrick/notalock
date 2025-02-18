import { type LoaderFunctionArgs, type TypedResponse, json } from '@remix-run/node';
import { useLoaderData, useNavigation } from '@remix-run/react';
import { createSupabaseClient } from '~/server/services/supabase.server';
import type { Product, ProductImage } from '~/features/products/types/product.types';
import ProductGallery from '~/features/products/components/ProductGallery';
import { ProductInfo } from '~/features/products/components/ProductInfo';
import { PageLayout } from '~/components/common/PageLayout';

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

  return json(
    { product },
    {
      headers: response.headers,
    }
  );
};

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === 'loading') {
    return (
      <PageLayout>
        <div className="animate-pulse" data-testid="loading-skeleton">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          <div className="w-full">
            <ProductGallery images={product.images} />
          </div>
          <ProductInfo product={product} />
        </div>
      </div>
    </PageLayout>
  );
}
