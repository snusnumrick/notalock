import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { useState } from 'react';
import {
  UserIcon,
  ShoppingBagIcon,
  ClipboardDocumentIcon,
  MapPinIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

export const meta: MetaFunction = () => {
  return [
    { title: 'My Account - Notalock' },
    {
      name: 'description',
      content: 'Manage your Notalock account, view orders, and update your profile.',
    },
  ];
};

export default function AccountPage() {
  const [isAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AccountLoginForm />;
  }

  return <AccountDashboard />;
}

function AccountLoginForm() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Account Login</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your Notalock account to manage orders and preferences.
            </p>
          </div>

          {/* Page Under Construction Notice */}
          <div className="rounded-lg bg-blue-50 p-6 mb-8 shadow-sm">
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
                  Account functionality is currently under development. Please check back soon.
                </p>
              </div>
            </div>
          </div>

          {/* Login Form Placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
            <form className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100 cursor-not-allowed"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-not-allowed"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    disabled
                    className="font-medium text-blue-600 hover:text-blue-500 pointer-events-none"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 opacity-60 cursor-not-allowed"
                >
                  Sign in
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="mt-1 grid grid-cols-1 gap-3">
                  <button
                    disabled
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-not-allowed opacity-60"
                  >
                    <span>Create new account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountDashboard() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your orders, addresses, and account settings.
          </p>
        </div>

        {/* Page Under Construction Notice */}
        <div className="rounded-lg bg-blue-50 p-6 mb-8 shadow-sm">
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
                Account functionality is currently under development. Please check back soon.
              </p>
            </div>
          </div>
        </div>

        {/* Account Dashboard Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group cursor-not-allowed opacity-60">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Profile</h3>
                <p className="text-sm text-gray-500">Manage your personal information</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group cursor-not-allowed opacity-60">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Orders</h3>
                <p className="text-sm text-gray-500">View and track your orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group cursor-not-allowed opacity-60">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                <MapPinIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Addresses</h3>
                <p className="text-sm text-gray-500">Manage your saved addresses</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group cursor-not-allowed opacity-60">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                <KeyIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Security</h3>
                <p className="text-sm text-gray-500">Update password and security settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Preview */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <button
              disabled
              className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-not-allowed opacity-60"
            >
              View all orders
            </button>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg">
            <div className="text-center py-12 text-gray-500">
              <ClipboardDocumentIcon className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-3 text-sm">No orders found</p>
              <Link
                to="/products"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Start Shopping
              </Link>
            </div>
          </div>
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
