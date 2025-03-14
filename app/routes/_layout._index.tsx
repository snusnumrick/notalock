import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { FeaturedProducts } from '~/features/products/components/FeaturedProducts';
import { NewArrivals } from '~/features/products/components/NewArrivals';
import { CategoryHighlightGrid } from '~/features/categories/components/CategoryHighlightGrid';
import { getCategoryService } from '~/features/categories/api/categoryService.server';
import { getHeroBannerService } from '~/features/hero-banners/api';
import { HeroSlider, HeroSliderSkeleton } from '~/features/hero-banners/components';
import type { Category } from '~/features/categories/types/category.types';
import type { HeroBanner } from '~/features/hero-banners/types/hero-banner.types';
import type { TransformedProduct } from '~/features/products/types/product.types';
import { Suspense } from 'react';
import { getProducts } from '~/features/products/api/products.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Notalock - European Door Hardware' },
    { name: 'description', content: 'Sophisticated European door hardware solutions' },
  ];
};

interface LoaderData {
  supabaseUrl: string;
  supabaseAnonKey: string;
  categories: Category[];
  banners: HeroBanner[];
  newArrivals: TransformedProduct[];
  featuredProducts: TransformedProduct[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set');
  }

  const response = new Response();

  // Fetch categories
  const categoryService = getCategoryService(request, response);
  const categoriesPromise = categoryService.fetchCategories({
    isHighlighted: true,
    isVisible: true,
  });

  // Fetch hero banners
  const heroBannerService = getHeroBannerService(request, response);
  const bannersPromise = heroBannerService.fetchHeroBanners({ isActive: true });

  // Fetch new arrivals using server-side getProducts function
  const newArrivalsPromise = getProducts({
    limit: 8,
    filters: { sortOrder: 'newest' },
  });

  // Fetch featured products using server-side getProducts function
  const featuredProductsPromise = getProducts({
    limit: 4,
    filters: { sortOrder: 'featured' },
  });

  // Wait for all promises to resolve
  const [categories, banners, newArrivalsResponse, featuredProductsResponse] = await Promise.all([
    categoriesPromise,
    bannersPromise,
    newArrivalsPromise,
    featuredProductsPromise,
  ]);

  return json<LoaderData>({
    supabaseUrl,
    supabaseAnonKey,
    categories,
    banners,
    newArrivals: newArrivalsResponse.products,
    featuredProducts: featuredProductsResponse.products,
  });
};

export default function Index() {
  const { categories, banners, newArrivals, featuredProducts } = useLoaderData<LoaderData>();

  return (
    <div className="bg-white flex-grow">
      <main className="pt-24 relative">
        {/* Hero Slider */}
        <Suspense fallback={<HeroSliderSkeleton />}>
          {banners && banners.length > 0 ? (
            <HeroSlider banners={banners} />
          ) : (
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
              <div className="max-w-7xl mx-auto">
                <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                  <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                    <div className="text-center relative z-10">
                      <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">Elevate Your Space with</span>
                        <span className="block text-blue-600 drop-shadow-sm">
                          European Craftsmanship
                        </span>
                      </h1>
                      <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl leading-relaxed">
                        Discover our curated collection of sophisticated door hardware. From
                        contemporary handles to innovative locking systems, each piece combines
                        elegance with precision engineering.
                      </p>
                      <div className="mt-8 flex justify-center gap-4">
                        <Link
                          to="/products"
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          Browse Products
                        </Link>
                        <Link
                          to="/about"
                          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          About Us
                        </Link>
                      </div>
                      {/*<div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                            <span className="text-blue-600">✓</span>
                          </span>
                          Premium Quality
                        </div>
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                            <span className="text-blue-600">✓</span>
                          </span>
                          Free Shipping
                        </div>
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                            <span className="text-blue-600">✓</span>
                          </span>
                          10-Year Warranty
                        </div>
                      </div>*/}
                    </div>
                  </div>
                </div>
              </div>
              {/* Scroll Indicator */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce opacity-70">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
            </div>
          )}
        </Suspense>

        {/* Featured Products Section */}
        <div className="bg-white pb-8">
          <FeaturedProducts products={featuredProducts} />
        </div>

        {/* New Arrivals Section */}
        <div className="bg-white py-8">
          <NewArrivals products={newArrivals} limit={8} />
        </div>

        {/* Featured Categories */}
        <div className="bg-gradient-to-b from-white to-gray-50 py-8">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 relative inline-block mb-6">
              <span className="relative z-10">Featured Categories</span>
              <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 z-0"></span>
            </h2>
            <div className="mt-6">
              <CategoryHighlightGrid categories={categories} view="grid" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
