import { getCategories } from '~/features/categories/api/categories.server';
import type { Category } from '~/features/categories/types/category.types';
// import type { Database } from '~/features/supabase/types/Database.types';
// type Tables = Database['public']['Tables'];
// type CategoryRow = Tables['categories']['Row'];

/*
function mapDbCategoryToAppCategory(category: CategoryRow): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    parent_id: category.parent_id,
    position: category.position,
    is_active: category.is_active,
    sort_order: category.sort_order,
    is_visible: category.is_visible,
    status: category.status ?? '',
    is_highlighted: category.is_highlighted,
    highlight_priority: category.highlight_priority,
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
}
*/

/**
 * Fetches categories from the database and returns them in the app format
 * Uses the existing getCategories function from categories.server.ts
 */
export async function fetchCategoriesFromDb(options?: {
  activeOnly?: boolean;
  parentId?: string | null;
  includeChildren?: boolean;
  isHighlighted?: boolean;
}): Promise<Category[]> {
  try {
    let categories = await getCategories({
      activeOnly: options?.activeOnly ?? true,
      parentId: options?.parentId,
      includeChildren: options?.includeChildren ?? true,
    });

    // Filter by highlighted status if requested
    if (options?.isHighlighted) {
      categories = categories.filter(category => category.isHighlighted);
    }

    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

/**
 * Simple cache implementation
 */
let cachedCategories: Category[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get categories with caching for better performance
 */
export async function getCategoriesWithCache(
  request?: Request,
  options?: {
    activeOnly?: boolean;
    parentId?: string | null;
    includeChildren?: boolean;
    isHighlighted?: boolean;
  }
): Promise<Category[]> {
  const currentTime = Date.now();

  // Skip cache when request is provided to ensure fresh data
  if (request) {
    return fetchCategoriesFromDb(options);
  }

  // Use cache if available and not expired
  if (cachedCategories && currentTime - cacheTimestamp < CACHE_TTL) {
    // Apply highlighted filter on cached data if needed
    if (options?.isHighlighted) {
      return cachedCategories.filter(category => category.isHighlighted);
    }
    return cachedCategories;
  }

  // Fetch fresh data
  const categories = await fetchCategoriesFromDb({
    ...options,
    isHighlighted: undefined, // Fetch all categories for cache, filter later if needed
  });

  // Update cache
  cachedCategories = categories;
  cacheTimestamp = currentTime;

  // Apply highlighted filter if requested
  if (options?.isHighlighted) {
    return categories.filter(category => category.isHighlighted);
  }

  return categories;
}

/**
 * For backward compatibility with existing code.
 * This now fetches data from the database instead of using hardcoded values.
 */
export let categories: Category[] = [];

/**
 * Initialize categories array - should be called from route loaders
 */
export function initializeCategories(Categories: Category[]) {
  categories = Categories;
}

/**
 * Build a category tree structure from a flat list of categories
 */
export function buildCategoryTree(categories: Category[]): Category[] {
  // Create a map of id to category object with children array added
  const categoryMap = new Map<string, Category & { children: Category[] }>();

  // First pass: populate the map with all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build the tree structure
  const rootCategories: (Category & { children: Category[] })[] = [];

  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;

    if (category.parentId && categoryMap.has(category.parentId)) {
      // If category has a parent, add it to parent's children
      categoryMap.get(category.parentId)!.children.push(categoryWithChildren);
    } else {
      // If no parent or parent not found, add to root categories
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}
