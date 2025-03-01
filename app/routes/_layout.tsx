import { Outlet } from '@remix-run/react';
import { Header } from '~/components/common/Header';
import { Footer } from '~/components/common/Footer';
import { CartProvider } from '~/features/cart/context/CartContext';

/**
 * Main layout for public-facing pages
 */
export default function Layout() {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <div className="flex-grow">
          <Outlet />
        </div>
        <Footer />
      </div>
    </CartProvider>
  );
}
