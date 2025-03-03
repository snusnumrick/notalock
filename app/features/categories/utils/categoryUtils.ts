import { categories } from '~/data/categories';
import { Category } from '../types/category.types';

/**
 * Find a category by its slug
 * @param slug The slug to search for
 * @param categoriesList The list of categories to search in (defaults to all categories)
 * @returns The found category or null if not found
 */
export const findCategoryBySlug = (
  slug: string,
  categoriesList: Category[] = categories
): Category | null => {
  for (const category of categoriesList) {
    if (category.slug === slug) {
      return category;
    }

    if (category.children && category.children.length > 0) {
      const found = findCategoryBySlug(slug, category.children);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

/**
 * Get the full path for a category, including all parent slugs
 * @param categorySlug The slug of the category
 * @returns Array of slugs representing the path
 */
export const getCategoryPath = (
  categorySlug: string,
  categoriesList: Category[] = categories,
  currentPath: string[] = []
): string[] => {
  for (const category of categoriesList) {
    const newPath = [...currentPath, category.slug];

    if (category.slug === categorySlug) {
      return newPath;
    }

    if (category.children && category.children.length > 0) {
      const foundPath = getCategoryPath(categorySlug, category.children, newPath);
      if (foundPath.length > 0) {
        return foundPath;
      }
    }
  }

  return [];
};

/**
 * Get all descendant category IDs for a given category
 * @param categoryId The ID of the parent category
 * @returns Array of category IDs including the parent and all descendants
 */
export const getCategoryDescendants = (
  categoryId: string,
  categoriesList: Category[] = categories
): string[] => {
  const descendants: string[] = [];

  const findDescendants = (categories: Category[], parentId: string) => {
    for (const category of categories) {
      if (category.id === parentId) {
        descendants.push(category.id);

        const processChildren = (childCategories: Category[]) => {
          childCategories.forEach(child => {
            descendants.push(child.id);
            if (child.children && child.children.length > 0) {
              processChildren(child.children);
            }
          });
        };

        if (category.children && category.children.length > 0) {
          processChildren(category.children);
        }

        return true;
      }

      if (category.children && category.children.length > 0) {
        if (findDescendants(category.children, parentId)) {
          return true;
        }
      }
    }

    return false;
  };

  findDescendants(categoriesList, categoryId);

  return descendants;
};
