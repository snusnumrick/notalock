import { Link } from '@remix-run/react';
import React, { useEffect, useState } from 'react';
import { ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline';
import { useCart } from '~/features/cart/context/CartContext';

export const Header: React.FC = () => {
  const { cartItems, summary } = useCart();
  const [cartItemCount, setCartItemCount] = useState(0);

  // Initialize cart count from useCart context
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const count = cartItems.reduce((total, item) => total + item.quantity, 0);
      console.log('Header - Updating count from cartItems:', count);
      setCartItemCount(count);
    }
  }, [cartItems]);

  // Only update from summary if it changes
  useEffect(() => {
    if (summary && summary.totalItems !== cartItemCount) {
      console.log('Header - Setting count from summary:', summary.totalItems);
      setCartItemCount(summary.totalItems);
    }
  }, [summary, cartItemCount]);

  // Listen for explicit cart count updates with timestamp management
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastTimestamp = 0;

    const handleCartCountUpdate = (e: CustomEvent<{ count: number; timestamp: number }>) => {
      if (!e.detail || typeof e.detail.count !== 'number') return;

      // Check if this is a newer update than the last one we processed
      if (e.detail.timestamp && e.detail.timestamp > lastTimestamp) {
        lastTimestamp = e.detail.timestamp;
        console.log('Header - Received cart count update:', e.detail.count);
        setCartItemCount(e.detail.count);
      }
    };

    // Add event listener
    window.addEventListener('cart-count-update', handleCartCountUpdate as EventListener);

    return () => {
      window.removeEventListener('cart-count-update', handleCartCountUpdate as EventListener);
    };
  }, []);

  return (
    <header className="bg-gray-100 border-b border-gray-300 shadow-sm fixed w-full top-0 z-50">
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
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 text-sm font-medium"
            >
              Products
            </Link>
            <Link
              to="/account"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 text-sm font-medium flex items-center"
            >
              <UserIcon className="w-4 h-4 mr-1" /> Account
            </Link>
            <Link
              to="/cart"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 text-sm font-medium flex items-center relative"
            >
              <ShoppingCartIcon className="w-4 h-4 mr-1" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span
                  data-cart-badge
                  className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {cartItemCount}
                </span>
              )}
              {cartItemCount === 0 && (
                <span
                  data-cart-badge
                  className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center hidden"
                >
                  0
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};
