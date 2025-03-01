import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'About Us - Notalock' },
    {
      name: 'description',
      content:
        'Learn about Notalock and our mission to provide high-quality European door hardware solutions.',
    },
  ];
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">About </span>
            <span className="block text-blue-600">Notalock</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Premium European door hardware for homes and businesses
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
              <h3 className="text-lg font-medium text-blue-800">Under Construction</h3>
              <p className="mt-1 text-sm text-blue-700">
                This page is under construction. Please check back soon for more information about
                our company, mission, and values.
              </p>
            </div>
          </div>
        </div>

        {/* Temporary Content Sections */}
        <div className="space-y-12 mb-16">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-600">
              Notalock was founded with a simple mission: to bring the sophistication and quality of
              European door hardware to discerning customers. What began as a small operation has
              grown into a trusted source for premium lock systems, handles, and architectural
              hardware.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Products</h2>
            <p className="text-gray-600 mb-4">
              We specialize in high-end European door hardware that combines elegant design with
              precision engineering. From contemporary door handles to innovative locking
              mechanisms, our products enhance both the security and aesthetics of any space.
            </p>
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Browse Our Products
              </Link>
            </div>
          </section>
        </div>

        {/* Return to Home */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
