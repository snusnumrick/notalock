import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Arrivals - Notalock' },
    {
      name: 'description',
      content: 'Discover our latest door hardware products and exclusive new arrivals.',
    },
  ];
};

export default function NewArrivalsPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            New Arrivals
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our latest additions to the Notalock collection
          </p>
        </div>

        {/* Page Under Construction Notice */}
        <div className="rounded-lg bg-blue-50 p-6 mb-12 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center space-x-4">
            <svg
              className="h-10 w-10 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-blue-800">Coming Soon</h3>
              <p className="mt-1 text-sm text-blue-700">
                We&apos;re currently preparing our New Arrivals section. Please check back soon to
                discover our latest products.
              </p>
            </div>
          </div>
        </div>

        {/* Temporary Empty State */}
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">New Products Coming Soon</h3>
          <p className="mt-1 text-gray-500 max-w-md mx-auto">
            We&apos;re constantly adding new products to our collection. This page will showcase our
            latest arrivals and exclusive new releases.
          </p>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Browse All Products
          </Link>
        </div>

        {/* Information Block */}
        <div className="mt-16 bg-gray-50 p-8 rounded-lg max-w-4xl mx-auto">
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
      </div>
    </div>
  );
}
