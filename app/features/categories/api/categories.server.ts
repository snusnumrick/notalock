import { getSupabase } from '~/lib/supabase';
import type { Category } from '~/features/products/types/product.types.ts';

interface GetCategoriesOptions {
  activeOnly?: boolean;
  parentId?: string | null;
  includeChildren?: boolean;
}

export async function getCategories({
  activeOnly = false,
  parentId = null,
  includeChildren = false,
}: GetCategoriesOptions = {}): Promise<Category[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('categories')
    .select(
      `
      id,
      name,
      slug,
      description,
      parent_id,
      position,
      is_active,
      sort_order,
      is_visible,
      status,
      is_highlighted,
      highlight_priority
    `
    )
    .order('sort_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true).eq('is_visible', true);
  }

  // Only add the parent_id filter if parentId is not null
  if (parentId !== undefined && parentId !== null) {
    query = query.eq('parent_id', parentId);
  } else if (parentId === null) {
    // If explicitly null, get root categories
    query = query.is('parent_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  if (!data) {
    return [];
  }

  const categories = data.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    parentId: category.parent_id,
    position: category.position,
    isActive: category.is_active,
    sortOrder: category.sort_order,
    isVisible: category.is_visible,
    status: category.status,
    isHighlighted: category.is_highlighted,
    highlightPriority: category.highlight_priority,
  }));

  if (includeChildren) {
    // For each category, fetch its children
    return await Promise.all(
      categories.map(async category => {
        const children: Category[] = await getCategories({
          parentId: category.id,
          includeChildren: true,
        });
        return { ...category, children };
      })
    );
  }

  return categories;
}
