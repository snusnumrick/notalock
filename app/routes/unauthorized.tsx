// app/routes/unauthorized.tsx
import { Link } from '@remix-run/react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Unauthorized Access</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don&apos;t have permission to access this page.
        </p>
        <div className="mt-4 flex justify-center">
          <Link to="/" className="text-blue-600 hover:text-blue-500">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
