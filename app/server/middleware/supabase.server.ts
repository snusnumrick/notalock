import { createServerClient } from '@supabase/ssr';

type CookieHandler = {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
};

/**
 * Creates a Supabase client with cookie handling for server-side operations
 */
export function createSupabaseClient(request: Request, response?: Response) {
  console.log('Creating Supabase client');
  const cookies = request.headers.get('Cookie') ?? '';
  response = response || new Response();

  const cookieHandlers: CookieHandler = {
    get: (key: string) => {
      const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
      return cookie ? cookie.split('=')[1] : null;
    },
    set: (key: string, value: string) => {
      // Ensure we're not setting duplicate cookies
      response!.headers.delete('Set-Cookie');
      response!.headers.append(
        'Set-Cookie',
        `${key}=${value}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600`
      );
    },
    remove: (key: string) => {
      response!.headers.append(
        'Set-Cookie',
        `${key}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
      );
    },
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: cookieHandlers,
    auth: {
      detectSessionInUrl: true,
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'sb-session', // Explicit storage key
    },
  });
}

/**
 * Helper to get the current session from a request
 */
export async function getSupabaseSession(request: Request) {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      // If there's an error getting the session, clean up cookies
      const cookieNames = ['sb-access-token', 'sb-refresh-token', 'sb-session'];
      cookieNames.forEach(name => {
        response.headers.append(
          'Set-Cookie',
          `${name}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
      });

      return { session: null, response };
    }

    return { session, response };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null, response };
  }
}
