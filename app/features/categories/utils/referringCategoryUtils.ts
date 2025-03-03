/**
 * Utilities for managing referring category context
 * Used to enhance breadcrumbs with the category path a user came from
 */

const STORAGE_KEY = 'notalock_referring_category';

export interface ReferringCategory {
  id: string;
  name: string;
  slug: string;
  path?: string; // Full path if it's a nested category
}

/**
 * Stores the referring category in localStorage
 */
export const storeReferringCategory = (category: ReferringCategory): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(category));
    }
  } catch (error) {
    console.error('Failed to store referring category:', error);
  }
};

/**
 * Retrieves the referring category from localStorage
 */
export const getReferringCategory = (): ReferringCategory | null => {
  try {
    if (typeof window !== 'undefined') {
      const storedCategory = localStorage.getItem(STORAGE_KEY);
      if (storedCategory) {
        return JSON.parse(storedCategory);
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve referring category:', error);
    return null;
  }
};

/**
 * Clears the referring category from localStorage
 */
export const clearReferringCategory = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear referring category:', error);
  }
};
