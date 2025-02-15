import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/middleware';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  const url = new URL(request.url);

  const code = url.searchParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      // Redirect to login with error
      return redirect('/login?error=Unable to confirm email');
    }

    // Successfully confirmed email, redirect to login
    return redirect('/login?message=Email confirmed successfully. Please sign in.');
  }

  // No code provided
  return redirect('/login?error=Invalid confirmation link');
};
