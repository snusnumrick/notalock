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
      response!.headers.append(
        'Set-Cookie',
        `${key}=${value}; Path=/; HttpOnly; SameSite=Lax; Secure`
      );
    },
    remove: (key: string) => {
      response!.headers.append(
        'Set-Cookie',
        `${key}=; Path=/; HttpOnly; SameSite=Lax; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
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
    },
  });
}

/**
 * Helper to get the current session from a request
 */
export async function getSupabaseSession(request: Request) {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { session, response };
}
