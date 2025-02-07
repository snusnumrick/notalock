import { json, redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData, isRouteErrorResponse, useRouteError } from '@remix-run/react';
import { ProductManagement } from '~/features/products/components/ProductManagement';
import { requireAdmin } from '~/server/middleware/auth.server';
import { createSupabaseClient } from '~/server/middleware/supabase.server';

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const { user, response } = await requireAdmin(request);
    const supabase = createSupabaseClient(request, response);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Log session state
    console.log('Admin products loader - User:', user);
    console.log('Admin products loader - Session:', session);

    if (!session) {
      throw redirect('/login');
    }

    // Add admin role to session context
    const sessionWithRole = {
      ...session,
      user: {
        ...session.user,
        role: 'admin',
      },
    };

    return json(
      {
        supabase: {
          url: process.env.SUPABASE_URL,
          anonKey: process.env.SUPABASE_ANON_KEY,
        },
        user,
        session: sessionWithRole,
      },
      {
        headers: response.headers,
      }
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let Remix handle redirects
    }

    console.error('Loader error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      {
        status: 500,
      }
    );
  }
};

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error.status} {error.statusText}
          </h1>
          <p className="text-gray-600">{error.data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600">An unexpected error occurred. Please try again later.</p>
      </div>
    </div>
  );
}

export default function Products() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProductManagement
          supabaseUrl={loaderData.supabase.url!}
          supabaseAnonKey={loaderData.supabase.anonKey!}
          initialSession={loaderData.session}
          user={loaderData.user}
        />
      </div>
    </div>
  );
}
