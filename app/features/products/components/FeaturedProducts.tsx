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
      <section className="py-16 px-4 md:px-6 lg:px-8">
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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 relative inline-block">
            <span className="relative z-10">Featured Products</span>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 z-0"></span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our selection of premium European door hardware
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => {
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

            return (
              <div key={product.id} className="group">
                <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-200 overflow-hidden">
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
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.categories.map(({ category }) => (
                        <Badge key={category.id} variant="secondary">
                          {category.name}
                        </Badge>
                      ))}
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
      </div>
    </section>
  );
}
