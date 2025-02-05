import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, isRouteErrorResponse, useRouteError } from '@remix-run/react';
import { ProductManagement } from '~/features/products/components/ProductManagement';
import { createServerClient } from '@supabase/ssr';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const cookies = request.headers.get('Cookie') ?? '';

  try {
    const cookieHandlers = {
      get: (key: string) => {
        const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
        if (!cookie) return null;
        return cookie.split('=')[1];
      },
      set: (key: string, value: string) => {
        response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
      },
      remove: (key: string) => {
        response.headers.append(
          'Set-Cookie',
          `${key}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
      },
    };

    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: cookieHandlers,
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return redirect('/login');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return redirect('/unauthorized');
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return json(
      {
        supabase: {
          url: process.env.SUPABASE_URL,
          anonKey: process.env.SUPABASE_ANON_KEY,
        },
        user,
        profile,
        session,
      },
      {
        headers: response.headers,
      }
    );
  } catch (error) {
    console.error('Loader error:', error);
    throw new Response('Internal Server Error', { status: 500 });
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
          <p className="text-gray-600">{error.data}</p>
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
          profile={loaderData.profile}
        />
      </div>
    </div>
  );
}
