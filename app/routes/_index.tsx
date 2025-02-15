import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { FeaturedProducts } from '~/features/products/components/FeaturedProducts';
import { CategoryHighlightGrid } from '~/features/categories/components/CategoryHighlightGrid';
import { getCategoryService } from '~/features/categories/api/categoryService.server';
import type { Category } from '~/features/categories/types/category.types';

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

  return json<LoaderData>({
    supabaseUrl,
    supabaseAnonKey,
    categories,
  });
};

export default function Index() {
  const { supabaseUrl, supabaseAnonKey, categories } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm fixed w-full top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <svg className="h-8 w-auto" viewBox="0 0 200 50">
                  <path
                    d="M40 25 A10 10 0 1 1 40 24.9L55 25"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="30" cy="25" r="5" fill="#1a1a1a" />

                  {/* Text */}
                  <text
                    x="65"
                    y="35"
                    fontFamily="Arial"
                    fontWeight="bold"
                    fontSize="24"
                    fill="#1a1a1a"
                  >
                    Notalock
                  </text>
                </svg>
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link
                to="/products"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Products
              </Link>
              <Link
                to="/account"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Account
              </Link>
              <Link
                to="/cart"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Cart
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
              <div className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Elevate Your Space with</span>
                    <span className="block text-blue-600">European Craftsmanship</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Discover our curated collection of sophisticated door hardware. From
                    contemporary handles to innovative locking systems, each piece combines elegance
                    with precision engineering.
                  </p>
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        to="/products"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                      >
                        Browse Collection
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        to="/contact"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                      >
                        Contact Expert
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
