import {
  type LoaderFunctionArgs,
  type TypedResponse,
  type MetaFunction,
  json,
} from '@remix-run/node';
import {
  useLoaderData,
  useNavigation,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';
import { createSupabaseClient } from '~/server/services/supabase.server';
import type {
  Product,
  ProductImage,
  ProductSummary,
  ProductVariant,
} from '~/features/products/types/product.types';
import ProductGallery from '~/features/products/components/ProductGallery';
import { ProductInfo } from '~/features/products/components/ProductInfo';
import { ProductVariantSelector } from '~/features/products/components/ProductVariantSelector';
import { RelatedProducts } from '~/features/products/components/RelatedProducts';
import { generateProductMeta } from '~/features/products/components/ProductSEO';
import { PageLayout } from '~/components/common/PageLayout';

interface LoaderData {
  product: Product & { images: ProductImage[]; variants?: ProductVariant[] };
  relatedProducts: ProductSummary[];
}

export const loader = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<TypedResponse<LoaderData>> => {
  try {
    const response = new Response();
    const supabase = createSupabaseClient(request, response);

    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        *,
        images:product_images(*),
        variants:product_variants(*)
      `
      )
      .eq('id', params.id)
      .order('sort_order', { referencedTable: 'product_images' })
      .single();

    if (error || !product) {
      throw new Response('Product not found', { status: 404 });
    }

    // Fetch related products (same category or by manufacturer)
    const { data: relatedProducts = [] } = await supabase
      .from('products')
      .select('id, name, retail_price, thumbnail_url')
      .neq('id', params.id) // Exclude current product
      .eq('category_id', product.category_id)
      .limit(4);

    return json(
      {
        product,
        relatedProducts: relatedProducts || [],
      },
      {
        headers: response.headers,
      }
    );
  } catch (error) {
    // Always let Remix handle redirects
    if (error instanceof Response) {
      throw error;
    }

    console.error('Product loader error:', error);
    throw new Response('An unexpected error occurred', {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  return generateProductMeta(data.product);
};

export default function ProductPage() {
  const { product, relatedProducts } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  if (navigation.state === 'loading') {
    return (
      <PageLayout>
        <div className="bg-white rounded-lg shadow" data-testid="loading-state">
          <div className="animate-pulse p-8" data-testid="loading-skeleton">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product image placeholder */}
              <div className="aspect-square bg-gray-200 rounded-lg"></div>

              {/* Product details placeholders */}
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Related products placeholder */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-square bg-gray-200 rounded-lg"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-white rounded-lg shadow">
        <nav className="p-4 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/" className="hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/products" className="hover:text-blue-600">
                Products
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium truncate">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          <div className="w-full">
            <ProductGallery images={product.images} />
          </div>
          <div className="space-y-6">
            <ProductInfo product={product} />
            {product.variants && product.variants.length > 0 && (
              <ProductVariantSelector
                variants={product.variants}
                onVariantChange={variantId => console.log('Selected variant:', variantId)}
              />
            )}
          </div>
        </div>

        <RelatedProducts products={relatedProducts} />
      </div>
    </PageLayout>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <PageLayout>
          <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Product Not Found</h1>
              <p className="mt-4 text-lg text-gray-500">
                The product you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <div className="mt-8">
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Browse Products
                </Link>
              </div>
            </div>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout>
        <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Something Went Wrong</h1>
            <p className="mt-4 text-lg text-gray-500">{error.data || error.statusText}</p>
            <div className="mt-8">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Unexpected Error</h1>
          <p className="mt-4 text-lg text-gray-500">
            An unexpected error occurred. Please try again later.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
