import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { createClient } from '@supabase/supabase-js';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';

interface Product {
  id: string;
  name: string;
  description: string;
  retail_price: number;
  featured: boolean;
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
}

interface FeaturedProductsProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function FeaturedProducts({ supabaseUrl, supabaseAnonKey }: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchFeaturedProducts = useCallback(async () => {
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
          featured,
          images:product_images(id, url, is_primary),
          categories:product_categories(category:categories(id, name))
        `
        )
        .eq('featured', true)
        .limit(4);

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
          featured: product.featured,
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

      setError('Failed to load featured products. Please try again.');
      console.error('Error fetching featured products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabaseUrl, supabaseAnonKey, navigate]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [supabaseUrl, supabaseAnonKey, fetchFeaturedProducts]);

  if (isLoading) {
    return (
      <section className="py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <Button onClick={fetchFeaturedProducts} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
          <p className="mt-4 text-lg text-gray-600">
            Discover our selection of premium European door hardware
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => {
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

            return (
              <Link key={product.id} to={`/products/${product.id}`} className="group">
                <Card className="h-full transition-transform duration-300 hover:scale-105">
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    {primaryImage ? (
                      <img
                        src={primaryImage.url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.categories.map(({ category }) => (
                        <Badge key={category.id} variant="secondary">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <p className="text-xl font-bold">
                      $
                      {product.retail_price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
