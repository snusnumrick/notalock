import { type LoaderFunction } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { CategoryManagement } from '~/features/categories/components/CategoryManagement';
import { CategoryService } from '~/features/categories/api/categoryService';
import { useSupabase } from '~/lib/supabase';

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await requireAdmin(request);
  return { user };
};

export default function AdminCategoriesRoute() {
  const { supabase } = useSupabase();
  const categoryService = new CategoryService(supabase);

  return (
    <div className="container py-8">
      <CategoryManagement categoryService={categoryService} />
    </div>
  );
}
