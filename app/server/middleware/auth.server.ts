import { redirect } from '@remix-run/node';
import type { User } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase.server';

export interface AuthUser extends User {
  role?: string;
}

interface AuthResult {
  user: AuthUser;
  response: Response;
}

/**
 * Middleware to require authentication for a route
 * Throws redirect to login if user is not authenticated
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw redirect('/login');
  }

  return { user, response };
}

/**
 * Middleware to require admin role for a route
 * Throws redirect to unauthorized if user is not an admin
 */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  const { user, response } = await requireAuth(request);
  const supabase = createSupabaseClient(request, response);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw redirect('/unauthorized');
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
    const supabase = createSupabaseClient(request, new Response());

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role ? allowedRoles.includes(profile.role) : false;
  } catch {
    return false;
  }
}
