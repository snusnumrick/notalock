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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

type ActionData = {
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = new URL(request.url);
  const fromUnauthorized = url.searchParams.get('from') === 'unauthorized';

  // If user is already logged in and not coming from unauthorized page, redirect
  if (session && !fromUnauthorized) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo');
    throw redirect(redirectTo || '/admin/products', {
      headers: response.headers,
    });
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
  const confirmPassword = formData.get('confirmPassword');
  const action = formData.get('action');

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

  if (action === 'signup') {
    if (!confirmPassword || typeof confirmPassword !== 'string') {
      fieldErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      fieldErrors.confirmPassword = 'Passwords do not match';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return json({ fieldErrors }, { status: 400 });
  }

  let error;
  let session;

  try {
    if (action === 'signup') {
      // Using signInWithPassword to check if user exists and is confirmed
      const { error: existingUserError } = await supabase.auth.signInWithPassword({
        email: email as string,
        password: password as string,
      });

      // If the error is 'Email not confirmed', user exists but needs confirmation
      if (existingUserError?.message === 'Email not confirmed') {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email as string,
        });

        if (resendError) {
          throw new Response('Failed to resend confirmation email', {
            status: 500,
            statusText: resendError.message,
          });
        }

        return json(
          { message: 'Confirmation email has been resent. Please check your inbox.' },
          { headers: response.headers }
        );
      }

      // If no error, user already exists and is confirmed
      if (!existingUserError) {
        throw new Response('An account with this email already exists', {
          status: 400,
          statusText: 'Account exists',
        });
      }

      // Create new user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email as string,
        password: password as string,
        options: {
          emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
        },
      });
      error = signUpError;
      session = data.session;

      if (!error) {
        return json(
          {
            message:
              'Please check your email to confirm your account. Confirmation email has been sent.',
          },
          { headers: response.headers }
        );
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email as string,
        password: password as string,
      });
      error = signInError;
      session = data.session;
    }

    if (error) {
      // Special handling for unconfirmed email
      if (error.message === 'Email not confirmed') {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email as string,
        });

        if (resendError) {
          throw new Response('Failed to resend confirmation email', {
            status: 500,
            statusText: resendError.message,
          });
        }

        return json(
          { message: 'Email not confirmed. A new confirmation email has been sent to your inbox.' },
          { headers: response.headers }
        );
      }

      // Handle other errors
      throw new Response(
        action === 'signup' ? 'Failed to create account' : 'Invalid email or password',
        {
          status: 401,
          statusText: error.message,
        }
      );
    }

    if (!session) {
      throw new Response('Authentication failed', {
        status: 401,
        statusText: 'Unable to create session',
      });
    }

    // After successful authentication
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // After successful authentication, check/create profile
    if (!profile) {
      await supabase.from('profiles').insert([
        {
          id: session.user.id,
          email: email,
          role: 'customer', // Default role for new sign-ups
        },
      ]);
    }

    // If user has admin role, redirect to admin products, otherwise to home
    return redirect(profile?.role === 'admin' ? '/admin/products' : '/', {
      headers: response.headers,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Authentication error:', error);
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
      return <AuthForm errorMessage={error.statusText} />;
    }
    return <AuthForm errorMessage={`Error: ${error.statusText}`} />;
  }

  return <AuthForm errorMessage="An unexpected error occurred. Please try again." />;
}

function AuthForm({ errorMessage }: { errorMessage?: string }) {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const navigation = useNavigation();
  const actionData = useActionData<ActionData & { message?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const redirectTo = searchParams.get('redirectTo');
  const isSubmitting = navigation.state === 'submitting';
  const [activeTab, setActiveTab] = useState('signin');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Notalock
          </h2>
        </div>

        {(errorMessage || error) && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{errorMessage || error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mt-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {actionData?.message && (
          <Alert className="mt-4">
            <AlertDescription>{actionData.message}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Form method="post" className="mt-8 space-y-6">
              <input type="hidden" name="redirectTo" value={redirectTo || ''} />
              <input type="hidden" name="action" value="signin" />
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="signin-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="signin-email"
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
                  <label htmlFor="signin-password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="signin-password"
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
          </TabsContent>

          <TabsContent value="signup">
            <Form method="post" className="mt-8 space-y-6">
              <input type="hidden" name="redirectTo" value={redirectTo || ''} />
              <input type="hidden" name="action" value="signup" />
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label htmlFor="signup-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="signup-email"
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
                  <label htmlFor="signup-password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="signup-password"
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
                      actionData?.fieldErrors?.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300'
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
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Login() {
  return <AuthForm />;
}
