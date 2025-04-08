import React, { useEffect, useState } from 'react';
import { Link, useLocation } from '@remix-run/react';
import type { Category } from '~/features/categories/types/category.types';
import { UserIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import CategoryMenu from './Navigation/CategoryMenu';
import { CategoryBreadcrumbs } from '~/features/categories/components/Breadcrumbs/CategoryBreadcrumbs';
import { HeaderCartIndicator } from './HeaderCartIndicator';
import { ThemeToggle } from '~/components/theme/theme-toggle';

interface HeaderProps {
  categories: Category[];
}

export const Header: React.FC<HeaderProps> = ({ categories }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const location = useLocation();

  // Show categories on the product detail pages
  const isProductPage =
    location.pathname != '/products' &&
    location.pathname != '/products/' &&
    (location.pathname.startsWith('/products/') || location.pathname.startsWith('/product/'));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-product-card border-b border-border shadow-sm fixed w-full top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              {!isMounted ? (
                // Server-side rendering (simpler version)
                <div className="h-8 w-auto flex items-center justify-center text-lg font-bold text-text-primary">
                  Notalock
                </div>
              ) : (
                // Client-side rendering with SVG
                <svg className="h-8 w-auto" viewBox="0 0 200 50">
                  <path
                    d="M40 25 A10 10 0 1 1 40 24.9L55 25"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="30" cy="25" r="5" fill="currentColor" />
                  <text
                    x="65"
                    y="35"
                    fontFamily="Arial"
                    fontWeight="bold"
                    fontSize="24"
                    fill="currentColor"
                  >
                    Notalock
                  </text>
                </svg>
              )}
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            <div className="hidden md:block">
              <Link
                to="/products"
                className="text-text-primary hover:text-btn-primary transition-colors duration-200 px-3 py-2 text-sm font-medium"
              >
                Products
              </Link>
            </div>
            <div className="hidden md:flex items-center">
              <Link
                to="/account"
                className="text-text-primary hover:text-btn-primary transition-colors duration-200 px-3 py-2 text-sm font-medium flex items-center"
              >
                <UserIcon className="w-4 h-4 mr-1" /> Account
              </Link>

              {/* Use our new cart indicator component */}
              <HeaderCartIndicator />

              {/* Theme Toggle */}
              <div className="ml-3">
                <ThemeToggle />
              </div>
            </div>

            <button
              className="md:hidden text-text-primary hover:text-btn-primary transition-colors duration-200"
              onClick={toggleMenu}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
        </div>

        {isProductPage && (
          <div className="hidden md:block py-2 border-t border-border">
            <CategoryMenu categories={categories} />
            {/* Debug: {categories.length} categories loaded */}
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <Link
              to="/products"
              className="block py-2 text-text-primary hover:text-btn-primary transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/account"
              className="block py-2 text-text-primary hover:text-btn-primary transition-colors duration-200 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <UserIcon className="w-4 h-4 mr-2" /> Account
            </Link>
            <div className="relative">
              <Link
                to="/cart"
                className="block py-2 text-text-primary hover:text-btn-primary transition-colors duration-200 flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCartIcon className="w-4 h-4 mr-2" /> Cart
              </Link>
              <div className="absolute top-2 left-16">
                <HeaderCartIndicator testId="mobile-cart-indicator" mobileStyle={true} />
              </div>
            </div>

            {/* Theme Toggle in mobile menu */}
            <div className="py-2 flex items-center">
              <span className="text-text-primary mr-2">Theme</span>
              <ThemeToggle />
            </div>

            {isProductPage && <CategoryMenu categories={categories} className="mt-2" />}
          </div>
        )}
      </nav>

      {/* Breadcrumbs - added below the header but will appear right at the top of the main content */}
      {isProductPage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Only show traditional breadcrumbs on non-category pages */}
          {!location.pathname.includes('/products/category/') && <CategoryBreadcrumbs />}
        </div>
      )}
    </header>
  );
};
