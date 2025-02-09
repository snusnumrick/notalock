import { render, screen, waitFor } from '@testing-library/react';
import { CategoryManagement } from '../components/CategoryManagement';
import { CategoryService } from '../services/categoryService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from '~/hooks/use-toast';
import userEvent from '@testing-library/user-event';

// Mock the toast component
vi.mock('~/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

describe('CategoryManagement', () => {
  const mockCategories = [
    {
      id: '1',
      name: 'Test Category',
      slug: 'test-category',
      description: '',
      sort_order: 0,
      is_visible: true,
      created_at: '2025-02-08T00:00:00Z',
      updated_at: '2025-02-08T00:00:00Z',
    },
  ];

  const mockCategoryService = {
    fetchCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    updatePositions: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryService.fetchCategories.mockResolvedValue(mockCategories);
    mockCategoryService.createCategory.mockResolvedValue(mockCategories[0]);
    mockCategoryService.updateCategory.mockResolvedValue(mockCategories[0]);
    mockCategoryService.deleteCategory.mockResolvedValue(undefined);
  });

  it('loads and displays categories on mount', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    await waitFor(() => {
      expect(mockCategoryService.fetchCategories).toHaveBeenCalled();
    });

    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('opens create category dialog', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    const addButton = screen.getByRole('button', { name: /add category/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create category/i })).toBeInTheDocument();
  });

  it('handles category creation successfully', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    // Open dialog
    const addButton = screen.getByRole('button', { name: /add category/i });
    await userEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, 'New Category');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create category/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCategoryService.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Category',
          description: '',
          is_visible: true,
          parent_id: '',
          slug: '',
          sort_order: 0,
        })
      );
    });
  });

  it('handles category update successfully', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit category');
    await userEvent.click(editButton);

    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Category');

    const submitButton = screen.getByRole('button', { name: /update category/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ name: 'Updated Category' })
      );
    });
  });

  it('handles category deletion successfully', async () => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete category');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith('1');
    });
  });

  it('handles toggle category active status', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    const toggleSwitch = screen.getByRole('switch');
    await userEvent.click(toggleSwitch);

    await waitFor(() => {
      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ is_visible: false })
      );
    });
  });

  it('displays error toast on fetch failure', async () => {
    const error = new Error('Failed to load categories');
    mockCategoryService.fetchCategories.mockRejectedValue(error);

    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive',
        })
      );
    });
  });

  it('displays success toast after successful category creation', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    // Open dialog
    const addButton = screen.getByRole('button', { name: /add category/i });
    await userEvent.click(addButton);

    // Fill form
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, 'New Category');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create category/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Category created successfully',
        })
      );
    });
  });

  it('closes dialog after successful operations', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    // Open dialog
    const addButton = screen.getByRole('button', { name: /add category/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.type(nameInput, 'New Category');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create category/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
