import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, isRouteErrorResponse, useRouteError } from '@remix-run/react';
import { ProductManagement } from '~/features/products/components/ProductManagement';
import { requireAdmin } from '~/server/middleware/auth.server';
import { createSupabaseClient } from '~/server/middleware/supabase.server';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check environment variables first
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Response('Missing required environment variables', {
      status: 500,
      statusText: 'Server Configuration Error',
    });
  }

  try {
    const { user, response } = await requireAdmin(request);
    const supabase = createSupabaseClient(request, response);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Response('Authentication required', {
        status: 401,
        statusText: 'Unauthorized',
      });
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
    // Let Remix handle redirects and responses
    if (error instanceof Response) {
      throw error;
    }

    console.error('Product management error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw new Response('Failed to load product management', {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

function ProductsErrorDisplay({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
          {action}
        </Alert>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 401:
        return (
          <ProductsErrorDisplay
            title="Authentication Required"
            message="Please log in to access product management."
            action={
              <div className="mt-4">
                <a href="/login" className="text-sm font-medium text-white hover:text-white/90">
                  Go to Login
                </a>
              </div>
            }
          />
        );
      case 403:
        return (
          <ProductsErrorDisplay
            title="Access Denied"
            message="You don't have permission to access product management."
          />
        );
      case 500:
        if (error.statusText === 'Server Configuration Error') {
          return (
            <ProductsErrorDisplay
              title="Server Configuration Error"
              message="The server is not properly configured. Please contact the administrator."
            />
          );
        }
        return (
          <ProductsErrorDisplay
            title="Server Error"
            message={error.statusText || 'An unexpected error occurred while loading products.'}
          />
        );
      default:
        return (
          <ProductsErrorDisplay
            title={`Error ${error.status}`}
            message={error.statusText || 'An unexpected error occurred.'}
          />
        );
    }
  }

  return (
    <ProductsErrorDisplay
      title="Error"
      message="An unexpected error occurred while loading product management."
    />
  );
}

export default function Products() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProductManagement
          supabaseUrl={loaderData.supabase.url}
          supabaseAnonKey={loaderData.supabase.anonKey}
          initialSession={loaderData.session}
        />
      </div>
    </div>
  );
}
