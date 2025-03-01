import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Terms & Conditions - Notalock' },
    {
      name: 'description',
      content: 'Terms and conditions for using Notalock products and services.',
    },
  ];
};

export default function TermsPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-lg text-gray-600">Last updated: February 28, 2025</p>
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
                Our terms and conditions page is currently being updated. A complete version will be
                available soon.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="prose prose-blue max-w-none">
          <p>
            Welcome to Notalock. By accessing our website, purchasing our products, or using our
            services, you agree to be bound by these Terms and Conditions.
          </p>

          <h2>Definitions</h2>
          <p>
            &quot;We&quot;, &quot;our&quot;, &quot;us&quot;, and &quot;Notalock&quot; refer to
            Notalock, Inc. &quot;You&quot; and &quot;your&quot; refer to the user or customer
            accessing or using our services.
          </p>

          <h2>Acceptance of Terms</h2>
          <p>
            By accessing or using our website, services, or products, you acknowledge that you have
            read, understood, and agree to be bound by these terms, which form a legal agreement
            between you and Notalock.
          </p>

          <h2>Products and Services</h2>
          <p>
            Notalock offers premium European door hardware products. We strive to provide accurate
            descriptions and images of our products, but we do not guarantee that product
            descriptions or other content are accurate, complete, reliable, current, or error-free.
          </p>

          <h2>Ordering and Payment</h2>
          <p>
            When you place an order through our website, you represent that you are of legal age and
            have the authority to make the purchase. All payments are processed securely through our
            payment processor.
          </p>

          <h2>Shipping and Delivery</h2>
          <p>
            Shipping times and costs vary depending on your location and chosen shipping method.
            Delivery dates are estimates and not guaranteed.
          </p>

          <h2>Returns and Refunds</h2>
          <p>
            Please refer to our Shipping Policy for detailed information on returns, exchanges, and
            refunds.
          </p>

          <h2>Warranty</h2>
          <p>
            Notalock provides a limited warranty for our products. The specific terms of the
            warranty vary by product category.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about these Terms & Conditions, please contact us at:</p>
          <p>
            Email:{' '}
            <a href="mailto:legal@notalock.com" className="text-blue-600 hover:text-blue-800">
              legal@notalock.com
            </a>
            <br />
            Mail: Notalock Legal Department, 123 Commerce St, Suite 100, Business City, BC 12345
          </p>
        </div>

        {/* Return to Home */}
        <div className="mt-12 text-center">
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
