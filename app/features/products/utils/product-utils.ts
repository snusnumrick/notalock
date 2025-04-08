/**
 * Utility functions for product-related operations
 */

/**
 * Determine if a product is new (less than 14 days old)
 */
export const isProductNew = (createdAt: string | null): boolean => {
  if (!createdAt) return false;

  try {
    const productDate = new Date(createdAt).getTime();
    const currentDate = new Date().getTime();
    const daysDiff = (currentDate - productDate) / (1000 * 60 * 60 * 24);
    return daysDiff < 14; // Less than 14 days old
  } catch (e) {
    return false; // If there's an error parsing the date, the product is not new
  }
};
