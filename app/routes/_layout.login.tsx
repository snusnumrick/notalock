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
import { createSupabaseClient } from '~/server/services/supabase.server';
import { useState } from 'react';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Database, UserRole } from '~/features/supabase/types/Database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

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
    const { data: profile }: { data: Profile | null } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // After successful authentication, check/create profile
    if (!profile) {
      await supabase.from('profiles').insert({
        id: session.user.id,
        email: email as string,
        role: 'customer' as UserRole, // Default role for new sign-ups
      });
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
    <div className="flex-grow flex items-center justify-center bg-page-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Branding section */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Notalock</h2>
          <p className="text-sm text-text-secondary">Sign in to your account to continue</p>
        </div>

        {/* Alert messages */}
        {(errorMessage || error) && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage || error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {actionData?.message && (
          <Alert>
            <AlertDescription>{actionData.message}</AlertDescription>
          </Alert>
        )}

        <div className="bg-product-card border border-border rounded-lg p-6 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Form method="post" className="space-y-4">
                <input type="hidden" name="redirectTo" value={redirectTo || ''} />
                <input type="hidden" name="action" value="signin" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`${actionData?.fieldErrors?.email ? 'border-destructive' : ''}`}
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    {actionData?.fieldErrors?.email && (
                      <p className="text-sm font-medium text-destructive">
                        {actionData.fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <button
                        type="button"
                        className="text-sm font-medium text-btn-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                        onClick={e => {
                          e.preventDefault();
                          alert('Password reset functionality would go here.');
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className={`${actionData?.fieldErrors?.password ? 'border-destructive' : ''}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    {actionData?.fieldErrors?.password && (
                      <p className="text-sm font-medium text-destructive">
                        {actionData.fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </Form>
            </TabsContent>

            <TabsContent value="signup">
              <Form method="post" className="space-y-4">
                <input type="hidden" name="redirectTo" value={redirectTo || ''} />
                <input type="hidden" name="action" value="signup" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`${actionData?.fieldErrors?.email ? 'border-destructive' : ''}`}
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    {actionData?.fieldErrors?.email && (
                      <p className="text-sm font-medium text-destructive">
                        {actionData.fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`${actionData?.fieldErrors?.password ? 'border-destructive' : ''}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    {actionData?.fieldErrors?.password && (
                      <p className="text-sm font-medium text-destructive">
                        {actionData.fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`${actionData?.fieldErrors?.confirmPassword ? 'border-destructive' : ''}`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    {actionData?.fieldErrors?.confirmPassword && (
                      <p className="text-sm font-medium text-destructive">
                        {actionData.fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

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

export default function Login() {
  return <AuthForm />;
}
