import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import {
  Form,
  useActionData,
  useNavigation,
  useRouteError,
  isRouteErrorResponse,
} from '@remix-run/react';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { useState } from 'react';
import { Alert, AlertDescription } from '~/components/ui/alert';

export const loader = async () => {
  // Check if it's from an allowed IP or development environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) {
    throw redirect('/unauthorized');
  }

  return json(null);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  const formData = await request.formData();

  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

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

  if (!confirmPassword || typeof confirmPassword !== 'string') {
    fieldErrors.confirmPassword = 'Please confirm your password';
  } else if (confirmPassword !== password) {
    fieldErrors.confirmPassword = 'Passwords do not match';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json({ fieldErrors }, { status: 400 });
  }

  try {
    // Create admin user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email as string,
      password: password as string,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (signUpError) {
      throw new Response('Failed to create admin account', {
        status: 401,
        statusText: signUpError.message,
      });
    }

    if (!data.user) {
      throw new Response('Failed to create user', {
        status: 500,
        statusText: 'User creation failed',
      });
    }

    // Create admin profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: email as string,
      role: 'admin' as const,
    });

    if (profileError) {
      throw new Response('Failed to create admin profile', {
        status: 500,
        statusText: profileError.message,
      });
    }

    return json(
      { message: 'Admin account created. Please check your email to confirm your account.' },
      { headers: response.headers }
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Admin creation error:', error);
    throw new Response('An unexpected error occurred', {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 401) {
      return <AdminSignupForm errorMessage={error.statusText} />;
    }
    return <AdminSignupForm errorMessage={`Error: ${error.statusText}`} />;
  }

  return <AdminSignupForm errorMessage="An unexpected error occurred. Please try again." />;
}

type ActionData = {
  message?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

function AdminSignupForm({ errorMessage }: { errorMessage?: string }) {
  const navigation = useNavigation();
  const actionData = useActionData<{
    message?: string;
    fieldErrors?: { email?: string; password?: string; confirmPassword?: string };
  }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Admin Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This form is only available in development mode
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {actionData?.message && (
          <Alert className="mt-4">
            <AlertDescription>{actionData.message}</AlertDescription>
          </Alert>
        )}

        <Form method="post" className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  actionData?.fieldErrors?.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
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
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  actionData?.fieldErrors?.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {actionData?.fieldErrors?.password && (
                <p className="mt-1 text-sm text-red-600">{actionData.fieldErrors.password}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  actionData?.fieldErrors?.confirmPassword ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              {actionData?.fieldErrors?.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {actionData.fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Create Admin Account'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default function AdminSignup() {
  return <AdminSignupForm />;
}
