import { CategoryService } from './categoryService';
import { createSupabaseClient } from '~/server/services/supabase.server';
let categoryServiceInstance: CategoryService | null = null;

export function getCategoryService(request: Request, response: Response) {
  if (!categoryServiceInstance) {
    const supabase = createSupabaseClient(request, response);
    categoryServiceInstance = new CategoryService(supabase);
  }
  return categoryServiceInstance;
}
