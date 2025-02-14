import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import {
  Form,
  useActionData,
  useSearchParams,
  useNavigation,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';
import { createSupabaseClient } from '~/server/middleware';
import { useState } from 'react';
import { Alert, AlertDescription } from '~/components/ui/alert';

type ActionData = {
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo');
    throw redirect(redirectTo || '/admin/products');
  }

  return json(null, {
    headers: response.headers,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  const formData = await request.formData();

  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = formData.get('redirectTo');

  const fieldErrors: ActionData['fieldErrors'] = {};
  if (!email || typeof email !== 'string') {
    fieldErrors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = 'Please enter a valid email address';
  }

  if (!password || typeof password !== 'string') {
    fieldErrors.password = 'Password is required';
  } else if (password.length < 6) {
    fieldErrors.password = 'Password must be at least 6 characters';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json({ fieldErrors }, { status: 400 });
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Response('Invalid email or password', {
      status: 401,
      statusText: 'Invalid credentials',
    });
  }

  return redirect(redirectTo?.toString() || '/admin/products', {
    headers: response.headers,
  });
};

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 401) {
      return <LoginForm errorMessage="Invalid email or password" />;
    }

    return <LoginForm errorMessage={`Error: ${error.statusText}`} />;
  }

  return <LoginForm errorMessage="An unexpected error occurred. Please try again." />;
}

function LoginForm({ errorMessage }: { errorMessage?: string }) {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const actionData = useActionData<ActionData>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const redirectTo = searchParams.get('redirectTo');
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="redirectTo" value={redirectTo || ''} />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  actionData?.fieldErrors?.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {actionData?.fieldErrors?.email && (
                <p className="mt-1 text-sm text-red-600">{actionData.fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  actionData?.fieldErrors?.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {actionData?.fieldErrors?.password && (
                <p className="mt-1 text-sm text-red-600">{actionData.fieldErrors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default function Login() {
  return <LoginForm />;
}
