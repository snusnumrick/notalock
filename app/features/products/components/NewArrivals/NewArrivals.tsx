import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { createClient } from '@supabase/supabase-js';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { ShoppingCart, ImageIcon } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  retail_price: number;
  images: {
    id: string;
    url: string;
    is_primary: boolean;
  }[];
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface NewArrivalsProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  limit?: number;
  showViewAllButton?: boolean;
  title?: string;
  description?: string;
}

// Determine if a product is new (less than 14 days old)
const isProductNew = (createdAt: string): boolean => {
  const productDate = new Date(createdAt).getTime();
  const currentDate = new Date().getTime();
  const daysDiff = (currentDate - productDate) / (1000 * 60 * 60 * 24);
  return daysDiff < 14; // Less than 14 days old
};

export function NewArrivals({
  supabaseUrl,
  supabaseAnonKey,
  limit = 4,
  showViewAllButton = true,
  title = 'New Arrivals',
  description = 'Check out our latest additions to the collection',
}: NewArrivalsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchNewArrivals = useCallback(async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error: supabaseError } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          retail_price,
          created_at,
          images:product_images(id, url, is_primary),
          categories:product_categories(category:categories(id, name))
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (supabaseError) throw supabaseError;

      const formattedData = (data || []).map(product => {
        // Safely extract valid categories
        const validCategories = (product.categories || [])
          .filter(cat => cat?.category && Array.isArray(cat.category) && cat.category.length > 0)
          .map(cat => ({
            category: {
              id: cat.category[0].id,
              name: cat.category[0].name,
            },
          }));

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          retail_price: product.retail_price,
          created_at: product.created_at,
          images: product.images || [],
          categories: validCategories,
        };
      });

      setProducts(formattedData);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.message.includes('JWT')) {
        navigate('/auth/login');
        return;
      }

      setError('Failed to load new arrivals. Please try again.');
      console.error('Error fetching new arrivals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUrl, supabaseAnonKey, navigate, limit]);

  useEffect(() => {
    fetchNewArrivals();
  }, [supabaseUrl, supabaseAnonKey, fetchNewArrivals]);

  if (isLoading) {
    return (
      <section className="py-16 px-4 md:px-6 lg:px-8" data-testid="loading-skeleton">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchNewArrivals} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  if (products.length === 0 && !isLoading && !error) {
    // Return empty state for when we've loaded but have no products
    return (
      <section className="py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-gray-900 relative inline-block mb-4"
            data-testid="empty-state-title"
          >
            <span className="relative z-10">{title}</span>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 z-0"></span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            No new products available at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold tracking-tight text-gray-900 relative inline-block"
            data-testid="section-title"
          >
            <span className="relative z-10">{title}</span>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 z-0"></span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => {
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

            return (
              <div key={product.id} className="group relative">
                <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-200 overflow-hidden">
                  {/* Add 'New' badge for products less than 14 days old */}
                  {isProductNew(product.created_at) && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">New</Badge>
                    </div>
                  )}
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
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
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.categories.slice(0, 2).map(({ category }) => (
                        <Badge key={category.id} variant="secondary">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-400">
                      Added {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-1 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 uppercase">Price</span>
                      <p className="text-xl font-bold text-blue-700">
                        $
                        {product.retail_price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Link to={`/products/${product.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
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
        {showViewAllButton && (
          <div className="mt-8 text-center">
            <Link to="/new-arrivals">
              <Button
                variant="outline"
                size="lg"
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                View All New Arrivals
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
