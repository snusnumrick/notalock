import { vi } from 'vitest';
import type { Category } from '../../types/category.types';
import type { CategoryService } from '../../services/categoryService';

export function createMockCategoryService(): jest.Mocked<CategoryService> {
  return {
    fetchCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    updatePositions: vi.fn(),
    fetchCategoryTree: vi.fn(),
  } as unknown as jest.Mocked<CategoryService>;
}

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test Description',
    sort_order: 0,
    is_visible: true,
    created_at: '2025-02-08T00:00:00Z',
    updated_at: '2025-02-08T00:00:00Z',
  },
];
