import { Outlet, Link, useLocation } from '@remix-run/react';

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
