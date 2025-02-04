import type { LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createServerClient } from '~/utils/supabase.server';
import { ProductManagement } from '~/components/admin/ProductManagement';

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();

  // Create supabase server client
  const supabase = createServerClient({ request, response });

  // Check if user is authenticated and is admin
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Response('Unauthorized', { status: 401 });
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }

  return json({});
};

export default function Products() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProductManagement />
      </div>
    </div>
  );
}
