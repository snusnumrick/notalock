import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Privacy Policy - Notalock' },
    {
      name: 'description',
      content:
        'Notalock privacy policy - how we collect, use, and protect your personal information.',
    },
  ];
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Privacy Policy
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
                Our privacy policy page is currently being updated. A complete version will be
                available soon.
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="prose prose-blue max-w-none">
          <p>
            At Notalock, we take your privacy seriously. This Privacy Policy describes how we
            collect, use, and share information about you when you use our website, products, and
            services.
          </p>

          <h2>Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account,
            make a purchase, contact customer support, or otherwise communicate with us.
          </p>

          <h2>How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services,
            process transactions, send communications, and more.
          </p>

          <h2>Sharing of Information</h2>
          <p>
            We may share information about you in certain circumstances, such as with service
            providers who perform services on our behalf, or when required by law.
          </p>

          <h2>Your Choices</h2>
          <p>
            You have choices about the information you provide and how we use it. You can manage
            your preferences through your account settings.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p>
            Email:{' '}
            <a href="mailto:privacy@notalock.com" className="text-blue-600 hover:text-blue-800">
              privacy@notalock.com
            </a>
            <br />
            Mail: Notalock Privacy Team, 123 Commerce St, Suite 100, Business City, BC 12345
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
