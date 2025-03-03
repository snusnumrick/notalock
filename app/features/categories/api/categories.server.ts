import { getSupabase } from '~/lib/supabase';
// import type { ProductCategory } from '~/features/products/types/product.types.ts';
import { Category } from '~/features/categories/types/category.types';

interface GetCategoriesOptions {
  activeOnly?: boolean;
  parentId?: string | null;
  includeChildren?: boolean;
  depth?: number;
  maxDepth?: number;
}

export async function getCategories({
  activeOnly = false,
  parentId = null,
  includeChildren = false,
  depth = 0,
  maxDepth = 5,
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

  const categories: Category[] = data.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    parentId: category.parent_id,
    position: category.position,
    isActive: category.is_active,
    sortOrder: category.sort_order,
    isVisible: category.is_visible,
    status: category.status ? category.status : '',
    isHighlighted: category.is_highlighted,
    highlightPriority: category.highlight_priority,
  }));

  if (includeChildren && depth < maxDepth) {
    return await Promise.all(
      categories.map(async category => {
        const children = await getCategories({
          parentId: category.id,
          includeChildren: true,
          depth: depth + 1,
          maxDepth,
        });
        return { ...category, children };
      })
    );
  }

  return categories;
}
