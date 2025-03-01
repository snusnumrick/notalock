import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Shipping Policy - Notalock' },
    {
      name: 'description',
      content: 'Information about Notalock shipping policies, delivery timeframes, and returns.',
    },
  ];
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Shipping Policy
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
                Our shipping policy page is currently being updated. A complete version will be
                available soon.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="prose prose-blue max-w-none">
          <p>
            At Notalock, we strive to provide timely and reliable shipping for all our premium door
            hardware products. This policy outlines our shipping methods, timeframes, costs, and
            return procedures.
          </p>

          <h2>Shipping Methods and Timeframes</h2>
          <p>
            We offer various shipping options to meet your needs. Delivery timeframes depend on your
            location and the shipping method selected during checkout.
          </p>
          <ul>
            <li>
              <strong>Standard Shipping:</strong> 5-7 business days
            </li>
            <li>
              <strong>Express Shipping:</strong> 2-3 business days
            </li>
            <li>
              <strong>Priority Shipping:</strong> 1-2 business days
            </li>
          </ul>

          <h2>Shipping Costs</h2>
          <p>
            Shipping costs are calculated based on the weight of your order, the shipping method
            selected, and your delivery location. You can view the exact shipping cost during
            checkout before completing your purchase.
          </p>

          <h2>Order Processing</h2>
          <p>
            Orders are typically processed within 1-2 business days after payment confirmation. You
            will receive an email confirmation with tracking information once your order has been
            shipped.
          </p>

          <h2>International Shipping</h2>
          <p>
            We ship to select international destinations. International orders may be subject to
            customs duties and taxes, which are the responsibility of the recipient.
          </p>

          <h2>Returns and Exchanges</h2>
          <p>
            If you&apos;re not completely satisfied with your purchase, you may return it within 30
            days of delivery. Please note the following conditions:
          </p>
          <ul>
            <li>Items must be in original, unused condition with all original packaging</li>
            <li>A return authorization must be obtained before sending the product back</li>
            <li>
              Return shipping costs are the responsibility of the customer unless the return is due
              to our error
            </li>
          </ul>

          <h2>Damaged or Defective Items</h2>
          <p>
            If your item arrives damaged or defective, please contact our customer service team
            within 7 days of receiving your order. We will arrange for a replacement or refund.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about our shipping policy, please contact us at:</p>
          <p>
            Email:{' '}
            <a href="mailto:shipping@notalock.com" className="text-blue-600 hover:text-blue-800">
              shipping@notalock.com
            </a>
            <br />
            Phone: (555) 123-4567
            <br />
            Mail: Notalock Shipping Department, 123 Commerce St, Suite 100, Business City, BC 12345
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
