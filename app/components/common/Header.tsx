import { Link } from '@remix-run/react';
import React from 'react';

export const Header: React.FC = () => {
  return (
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
  );
};
