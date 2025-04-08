import { Outlet, Link, useLocation, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import { type LoaderFunction, redirect } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { ThemeToggle } from '~/components/theme/theme-toggle';

export const loader: LoaderFunction = async ({ request }) => {
  // console.log('Starting admin permissions check');
  try {
    await requireAdmin(request);
    return null;
  } catch (error) {
    if (error instanceof Response && error.status === 302) {
      console.log('Preserve the redirect from requireAdmin/requireAuth', error);
      throw error; // Preserve the redirect from requireAdmin/requireAuth
    }
    const url = new URL(request.url);
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirectTo', url.pathname + url.search);
    console.log('Redirecting to login', loginUrl.pathname + loginUrl.search);
    throw redirect(loginUrl.pathname + loginUrl.search);
  }
};

export function ErrorBoundary() {
  const error = useRouteError();

  let errorMessage = 'An error occurred in the admin section.';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen bg-page-bg px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto text-center">
        <main>
          <p className="text-4xl font-bold text-btn-primary sm:text-5xl mb-4">{errorStatus}</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight sm:text-3xl mb-2">
            Admin Error
          </h1>
          <p className="mt-2 text-base text-text-secondary mb-6">{errorMessage}</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              to="/admin"
              className="rounded-md bg-btn-primary px-3.5 py-2.5 text-sm font-semibold text-btn-primary-text shadow-sm hover:bg-btn-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-btn-primary"
            >
              Return to Admin Dashboard
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  const getLinkClassName = (path: string) => {
    const baseClasses =
      'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors duration-200';
    const isActive = currentPath.startsWith(path);

    return `${baseClasses} ${
      isActive
        ? 'border-btn-primary text-text-primary'
        : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
    }`;
  };

  return (
    <div className="min-h-screen bg-page-bg text-text-primary">
      <div className="bg-product-card shadow border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/admin" className="text-xl font-bold hover:text-text-secondary">
                  Notalock Admin
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link to="/admin/products" className={getLinkClassName('/admin/products')}>
                  Products
                </Link>
                <Link to="/admin/orders" className={getLinkClassName('/admin/orders')}>
                  Orders
                </Link>
                <Link
                  to="/admin/orders/analytics"
                  className={getLinkClassName('/admin/orders/analytics')}
                >
                  Analytics
                </Link>
                <Link to="/admin/categories" className={getLinkClassName('/admin/categories')}>
                  Categories
                </Link>
                <Link to="/admin/hero-banners" className={getLinkClassName('/admin/hero-banners')}>
                  Hero Banners
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
