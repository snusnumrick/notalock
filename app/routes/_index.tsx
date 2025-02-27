import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { FeaturedProducts } from '~/features/products/components/FeaturedProducts';
import { CategoryHighlightGrid } from '~/features/categories/components/CategoryHighlightGrid';
import { getCategoryService } from '~/features/categories/api/categoryService.server';
import { getHeroBannerService } from '~/features/hero-banners/api';
import { HeroSlider, HeroSliderSkeleton } from '~/features/hero-banners/components';
import type { Category } from '~/features/categories/types/category.types';
import type { HeroBanner } from '~/features/hero-banners/types/hero-banner.types';
import { Header } from '~/components/common/Header';
import { Suspense } from 'react';

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
}

export const loader: LoaderFunction = async ({ request }) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set');
  }

  const response = new Response();
  const categoryService = getCategoryService(request, response);

  const categories = await categoryService.fetchCategories({
    isHighlighted: true,
    isVisible: true,
  });

  // Get hero banners
  const heroBannerService = getHeroBannerService(request, response);
  const banners = await heroBannerService.fetchHeroBanners({ isActive: true });

  // console.log('Directly fetched banners:', banners);

  return json<LoaderData>({
    supabaseUrl,
    supabaseAnonKey,
    categories,
    banners,
  });
};

export default function Index() {
  const { supabaseUrl, supabaseAnonKey, categories, banners } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16">
        {/* Hero Slider */}
        <Suspense fallback={<HeroSliderSkeleton />}>
          {banners && banners.length > 0 ? (
            <HeroSlider banners={banners} />
          ) : (
            <div className="relative bg-white overflow-hidden">
              <div className="max-w-7xl mx-auto">
                <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
                  <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                    <div className="text-center">
                      <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">Elevate Your Space with</span>
                        <span className="block text-blue-600">European Craftsmanship</span>
                      </h1>
                      <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
                        Discover our curated collection of sophisticated door hardware. From
                        contemporary handles to innovative locking systems, each piece combines
                        elegance with precision engineering.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Suspense>

        {/* Featured Products Section */}
        <div className="bg-white">
          <FeaturedProducts supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
        </div>

        {/* Featured Categories */}
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Featured Categories
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
