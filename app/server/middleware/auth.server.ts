import { redirect } from '@remix-run/node';
import type { PostgrestError, User } from '@supabase/supabase-js';
import { createSupabaseClient, SupabaseServerType } from '../services/supabase.server';
import { Database } from '~/features/supabase/types/Database.types';

export interface AuthUser extends User {
  role?: string;
}

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthResult {
  user: AuthUser;
  response: Response;
}

/**
 * Middleware to require authentication for a route
 * Throws redirect to login if user is not authenticated
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  console.log('app/server/middleware/auth.server.ts - Starting requireAuth check');
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.log('Auth check failed:', { error, user });
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirectTo', redirectTo);
    throw redirect(loginUrl.pathname + loginUrl.search);
  }

  return { user, response };
}

/**
 * Middleware to require admin role for a route
 * Throws redirect to unauthorized if user is not an admin
 */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  console.log('app/server/middleware/auth.server.ts -Starting requireAdmin check');
  const { user, response } = await requireAuth(request);
  const supabase = createSupabaseClient(request, response);
  const url = new URL(request.url);

  const {
    data: profile,
    error: profileError,
  }: {
    data: Profile | null;
    error: PostgrestError | null;
  } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (profileError || profile?.role !== 'admin') {
    console.log('Admin check failed:', { profileError, role: profile?.role });
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('from', 'unauthorized');
    throw redirect(loginUrl.pathname + loginUrl.search);
  }

  return {
    user: { ...user, role: profile.role },
    response,
  };
}

/**
 * Helper to check if a user has specific roles
 * Does not throw redirects, useful for conditional UI rendering
 */
export async function checkUserRole(request: Request, allowedRoles: string[]): Promise<boolean> {
  try {
    const { user } = await requireAuth(request);
    const supabase: SupabaseServerType = createSupabaseClient(request, new Response());

    const { data: profile }: { data: Profile | null } = await supabase

      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role ? allowedRoles.includes(profile.role) : false;
  } catch {
    return false;
  }
}
