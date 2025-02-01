import { Outlet } from "@remix-run/react";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold">Notalock Admin</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <a
                  href="/admin/products"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Products
                </a>
                <a
                  href="/admin/orders"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Orders
                </a>
                <a
                  href="/admin/users"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Users
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}