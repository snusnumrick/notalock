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

// Extended product interface for additional optional properties
interface ExtendedProduct extends Product {
  specifications?: string | null;
  features?: string | null;
}
import ProductGallery from '~/features/products/components/ProductGallery';
import { ProductInfo } from '~/features/products/components/ProductInfo';
import { ProductVariantSelector } from '~/features/products/components/ProductVariantSelector';
import { RelatedProducts } from '~/features/products/components/RelatedProducts';
import { generateProductMeta } from '~/features/products/components/ProductSEO';
import { PageLayout } from '~/components/common/PageLayout';

interface LoaderData {
  product: ExtendedProduct & {
    images: ProductImage[];
    variants?: ProductVariant[];
  };
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
      .eq('slug', params.slug || '') // Add fallback in case slug is undefined
      .order('sort_order', { referencedTable: 'product_images' })
      .single();

    if (error || !product) {
      throw new Response('Product not found', { status: 404 });
    }

    // Define a more complete database product interface
    interface DatabaseProduct extends Omit<Product, 'images'> {
      category_id?: string;
      images: Array<ProductImage>;
      variants: Array<{
        id: string;
        product_id: string;
        sku?: string | null;
        name?: string;
        price_adjustment?: number;
        retail_price?: number | null;
        business_price?: number | null;
        stock?: number | null;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      }>;
      [key: string]: string | number | boolean | object | null | undefined; // Allow for other fields from the database
    }

    const typedProduct = product as DatabaseProduct;

    // Fetch related products (same category or by manufacturer)
    let relatedProducts: ProductSummary[] = [];
    if (typedProduct.category_id) {
      try {
        const { data: relatedProductsData, error } = await supabase
          .from('products')
          .select('id, name, slug, retail_price, image_url') // Using image_url instead of thumbnail_url
          .neq('id', typedProduct.id) // Exclude current product
          .eq('category_id', typedProduct.category_id)
          .limit(4);

        if (error) {
          console.error('Error fetching related products:', error);
        } else if (relatedProductsData) {
          // Map to ProductSummary format
          relatedProducts = relatedProductsData.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            retail_price: product.retail_price,
            image_url: product.image_url || '',
          }));
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      }
    }

    // Make sure the product conforms to the expected ExtendedProduct type with images and variants
    const productWithProcessedData = {
      ...typedProduct,
      images: typedProduct.images || [],
      variants: typedProduct.variants || [],
    } as ExtendedProduct & { images: ProductImage[]; variants?: ProductVariant[] };

    return json(
      {
        product: productWithProcessedData,
        relatedProducts,
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
        {/*<CategoryBreadcrumbs className="p-4" />*/}

        {/* Conditional layout: Full layout if there are images or a main image_url, text-only layout if there are none */}
        {(product.images && product.images.length > 0) || product.image_url ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="w-full">
              {product.images && product.images.length > 0 ? (
                <ProductGallery images={product.images} />
              ) : product.image_url ? (
                <div
                  className="w-full space-y-4"
                  role="tabpanel"
                  aria-label="Product image gallery"
                >
                  <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-300"
                      loading="eager"
                    />
                  </div>
                </div>
              ) : null}
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
        ) : (
          <div className="p-8">
            {/* Text-only layout when no images are available */}
            <div className="border border-gray-200 rounded-lg p-6 mb-8 text-center">
              <div className="w-full max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <p className="text-gray-600">No product images are currently available.</p>
              </div>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {product.sku ? `SKU: ${product.sku}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="border-t border-gray-200 pt-4">
                    <h2 className="text-xl font-medium text-gray-900 mb-4">Description</h2>
                    <div className="prose max-w-none text-gray-600">{product.description}</div>
                  </div>

                  {/* Additional product details */}
                  {product.specifications && (
                    <div className="border-t border-gray-200 pt-4">
                      <h2 className="text-xl font-medium text-gray-900 mb-4">Specifications</h2>
                      <div className="prose max-w-none text-gray-600">{product.specifications}</div>
                    </div>
                  )}

                  {product.features && (
                    <div className="border-t border-gray-200 pt-4">
                      <h2 className="text-xl font-medium text-gray-900 mb-4">Features</h2>
                      <div className="prose max-w-none text-gray-600">{product.features}</div>
                    </div>
                  )}
                </div>

                {/* Right sidebar with pricing and add to cart */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    Pricing & Availability
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Retail Price</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {product.retail_price != null ? (
                          <>${product.retail_price.toFixed(2)}</>
                        ) : (
                          '$N/A'
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Stock</p>
                      <p className="text-lg text-gray-900">{product.stock} available</p>
                    </div>
                  </div>

                  {/* Add to cart form */}
                  <div className="mt-4">
                    <label
                      htmlFor="quantity-no-image"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Quantity
                    </label>
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        id="quantity-no-image"
                        type="number"
                        min="1"
                        max={product.stock || 0}
                        defaultValue="1"
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium
                               hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                               focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={(product.stock ?? 0) <= 0}
                      >
                        {(product.stock ?? 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>

                  {/* Variant selector if needed */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Options</h3>
                      <ProductVariantSelector
                        variants={product.variants}
                        onVariantChange={variantId => console.log('Selected variant:', variantId)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <RelatedProducts
          products={relatedProducts?.map(product => ({
            ...product,
            image_url: product.image_url ?? undefined,
          }))}
        />
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
