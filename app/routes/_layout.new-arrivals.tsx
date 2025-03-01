import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { productsLoader, ProductLoaderData } from '~/features/products/api/loaders';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { ShoppingCart, ImageIcon } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Arrivals - Notalock' },
    {
      name: 'description',
      content: 'Discover our latest door hardware products and exclusive new arrivals.',
    },
  ];
};

/**
 * Loader for the New Arrivals page.
 * Uses the products loader with the 'newest' sort order to fetch the most recently added products.
 */
export const loader = async ({ request, params, context }: LoaderFunctionArgs) => {
  // Create a modified request URL with the 'newest' sort order parameter
  const url = new URL(request.url);
  url.searchParams.set('sortOrder', 'newest');
  url.searchParams.set('limit', '12');

  // Create a new request with the modified URL
  const modifiedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: request.method,
  });

  // Use the productsLoader from the products API
  const loaderData = await productsLoader({ request: modifiedRequest, params, context });

  return json<ProductLoaderData>(loaderData);
};

export default function NewArrivalsPage() {
  const { products } = useLoaderData<ProductLoaderData>();

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 mt-16 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            New Arrivals
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our latest additions to the Notalock collection
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No New Products Available</h3>
            <p className="mt-1 text-gray-500 max-w-md mx-auto">
              We&apos;re working on adding new products to our collection. Please check back soon!
            </p>
            <div className="mt-8">
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => {
              return (
                <div key={product.id} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-lg border border-gray-200 overflow-hidden">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-4 pb-0">
                      <Link to={`/products/${product.id}`}>
                        <CardTitle className="text-lg font-semibold line-clamp-2 hover:text-blue-600 transition-colors">
                          {product.name}
                        </CardTitle>
                      </Link>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {product.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.categories.slice(0, 2).map(cat => (
                          <Badge key={cat.id} variant="secondary">
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 text-xs text-gray-500">
                        Added on {new Date(product.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase">Price</span>
                        <p className="text-xl font-bold text-blue-700">
                          $
                          {product.price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <Link to={`/products/${product.id}`}>
                        <Button
                          size="sm"
                          className="rounded-full transition-all hover:bg-blue-600 hover:text-white"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" /> View
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-16 bg-gray-50 p-8 rounded-lg max-w-4xl mx-auto shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Stay Updated on New Releases</h2>
            <p className="text-gray-700 mb-6">
              Would you like to be notified when we add new products to our collection? Follow us on
              social media or check back regularly for updates.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://twitter.com/notalock"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Twitter
              </a>
              <a
                href="https://facebook.com/notalock"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Facebook
              </a>
              <a
                href="https://instagram.com/notalock"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Instagram
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
