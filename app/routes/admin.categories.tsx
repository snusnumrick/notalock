import { type LoaderFunction, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { CategoryManagement } from '~/features/categories/components/CategoryManagement';
import { CategoryService } from '~/features/categories/services/categoryService';
import { useSupabase } from '~/lib/supabase';
import { createSupabaseClient } from '~/server/services/supabase.server';

export const loader: LoaderFunction = async ({ request }) => {
  console.log('Starting admin categories loader');
  const response = new Response();
  const { user } = await requireAdmin(request);
  const supabase = createSupabaseClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return json(
    {
      user,
      session,
    },
    {
      headers: response.headers,
    }
  );
};

export default function AdminCategoriesRoute() {
  const { session } = useLoaderData<typeof loader>();
  const { supabase } = useSupabase();

  // Initialize Supabase client with session
  if (session) {
    supabase.auth.setSession(session);
  }

  const categoryService = new CategoryService(supabase, session);

  return (
    <div className="container py-8">
      <CategoryManagement categoryService={categoryService} />
    </div>
  );
}
