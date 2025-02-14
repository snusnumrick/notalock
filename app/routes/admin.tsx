import { Outlet, Link, useLocation, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import { type LoaderFunction, redirect } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  console.log('Starting admin permissions check');
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
    <div className="min-h-screen bg-gray-50 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto text-center">
        <main>
          <p className="text-4xl font-bold text-blue-600 sm:text-5xl mb-4">{errorStatus}</p>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight sm:text-3xl mb-2">
            Admin Error
          </h1>
          <p className="mt-2 text-base text-gray-500 mb-6">{errorMessage}</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              to="/admin"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
        ? 'border-blue-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/admin" className="text-xl font-bold hover:text-gray-700">
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
                <Link to="/admin/users" className={getLinkClassName('/admin/users')}>
                  Users
                </Link>
                <Link to="/admin/categories" className={getLinkClassName('/admin/categories')}>
                  Categories
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
