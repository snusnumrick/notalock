import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';
import * as build from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import stylesheet from '~/styles/tailwind.css';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { Session } from '@supabase/supabase-js';
import { CartProvider } from '~/features/cart/context/CartContext';
import { CartServiceRPC } from '~/features/cart/api/cartServiceRPC';
import type { CartItem } from '~/features/cart/types/cart.types';
import { useEffect } from 'react';
// Import the client-side initialization script
import './root.client';
// Import cart cookie functions
import { getAnonymousCartId, setAnonymousCartId } from '~/features/cart/utils/serverCookie';
import { CART_COUNT_EVENT_NAME, CART_DATA_STORAGE_KEY } from '~/features/cart/constants';
import { Toaster } from '~/components/ui/toaster';
import { ToastManagerProvider } from '~/components/ui/toast-manager';

export const links = () => [{ rel: 'stylesheet', href: stylesheet }];

export const meta = () => {
  return [
    { title: 'Notalock Store' },
    { name: 'viewport', content: 'width=device-width,initial-scale=1' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession();

  let profile = null;
  if (supabaseSession?.user.id) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', supabaseSession.user.id)
      .single();
    if (data) {
      profile = data;
    }
  }

  // Get or create anonymous cart ID from cookie
  const anonymousCartId = await getAnonymousCartId(request);
  // console.log('Root loader: Using anonymous cart ID from cookie:', anonymousCartId);

  // Set cookie for future requests
  await setAnonymousCartId(response, anonymousCartId);

  // Fetch cart items using the anonymous cart ID
  const cartService = new CartServiceRPC(supabase, anonymousCartId);
  const cartItems = await cartService.getCartItems();

  // console.log(
  //   `Root loader: Loaded ${cartItems.length} cart items for anonymous ID ${anonymousCartId}`
  // );

  return build.json(
    {
      session: supabaseSession,
      profile,
      cartItems,
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    },
    {
      headers: response.headers,
    }
  );
};

interface LoaderData {
  session: Session | null;
  profile: { role: string } | null;
  cartItems: CartItem[];
  env: {
    SUPABASE_URL: string | undefined;
    SUPABASE_ANON_KEY: string | undefined;
  };
}

export function ErrorBoundary() {
  const error = useRouteError();

  let errorMessage = 'An unexpected error occurred.';
  let errorTitle = 'Something went wrong';
  let errorDetail = '';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    // Check for Supabase configuration errors
    if (errorMessage.includes('Supabase') || errorMessage.includes('supabase')) {
      errorTitle = 'Supabase Configuration Error';
      errorDetail = `The application is not properly connected to the database. This usually happens when environment variables are missing.\n\nIf you are the site administrator, please check that SUPABASE_URL and SUPABASE_ANON_KEY are correctly set in your environment.`;
    }
  }

  return (
    <html lang="en">
      <head>
        <title>Error - Notalock Store</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50">
        <div className="min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div className="mx-auto max-w-max">
            <main className="sm:flex">
              <p className="text-4xl font-bold tracking-tight text-blue-600 sm:text-5xl">
                {errorStatus}
              </p>
              <div className="sm:ml-6">
                <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                    {errorTitle}
                  </h1>
                  <p className="mt-2 text-base text-gray-500">{errorMessage}</p>
                  {errorDetail && (
                    <p className="mt-4 text-sm text-gray-500 whitespace-pre-line">{errorDetail}</p>
                  )}
                </div>
                <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                  <a
                    href="/"
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Go back home
                  </a>
                </div>
              </div>
            </main>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { env, cartItems } = useLoaderData<LoaderData>();

  // Ensure localStorage is consistent with CartProvider
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Server-side cart data should be the source of truth
        if (cartItems && cartItems.length > 0) {
          // console.log(
          //   'Root - Server provided',
          //   cartItems.length,
          //   'cart items, using as source of truth'
          // );
          // Save server data to localStorage
          localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(cartItems));
          // Calculate total items
          const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
          // console.log('count event 1', totalItems);
          // Dispatch count event
          // console.log('count event 20', totalItems);

          window.dispatchEvent(
            new CustomEvent(CART_COUNT_EVENT_NAME, {
              detail: { count: totalItems },
            })
          );
          return;
        }

        // Only use localStorage if server doesn't provide cart items
        const savedCart = localStorage.getItem(CART_DATA_STORAGE_KEY);
        if (savedCart) {
          try {
            const parsedItems = JSON.parse(savedCart);
            if (Array.isArray(parsedItems) && parsedItems.length > 0) {
              console.log('Root - Using', parsedItems.length, 'cart items from localStorage');
              // Calculate total items
              const totalItems = parsedItems.reduce((total, item) => total + item.quantity, 0);
              // Dispatch count event
              // console.log('count event 21', totalItems);

              window.dispatchEvent(
                new CustomEvent(CART_COUNT_EVENT_NAME, {
                  detail: { count: totalItems },
                })
              );
            }
          } catch (parseError) {
            console.error('Root - Error parsing localStorage cart:', parseError);
            // Clear invalid localStorage data
            localStorage.removeItem(CART_DATA_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Root - Error accessing localStorage:', err);
      }
    }
  }, [cartItems]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        <CartProvider initialCartItems={cartItems}>
          <ToastManagerProvider>
            <Outlet />
            <Toaster />
          </ToastManagerProvider>
        </CartProvider>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
