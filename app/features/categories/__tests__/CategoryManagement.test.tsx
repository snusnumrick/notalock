import { render, screen, waitFor } from '@testing-library/react';
import { CategoryManagement } from '../components/CategoryManagement';
import { CategoryService } from '../services/categoryService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock toast function
const mockToast = vi.fn();

// Mock the useToast hook
vi.mock('~/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
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

  // Mock console.error to prevent error logging during error test cases
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCategoryService.fetchCategories.mockResolvedValue(mockCategories);
    mockCategoryService.createCategory.mockResolvedValue(mockCategories[0]);
    mockCategoryService.updateCategory.mockResolvedValue(mockCategories[0]);
    mockCategoryService.deleteCategory.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and displays categories on mount', async () => {
    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    await waitFor(() => {
      expect(mockCategoryService.fetchCategories).toHaveBeenCalled();
    });

    expect(screen.getByRole('cell', { name: 'Test Category' })).toBeInTheDocument();
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
      expect(screen.getByRole('cell', { name: 'Test Category' })).toBeInTheDocument();
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

    // Wait for the data to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    // Now that we know the category exists, find the switch
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
    // Silence console.error for this specific test
    const error = new Error('Failed to load categories');
    mockCategoryService.fetchCategories.mockRejectedValueOnce(error);

    render(
      <CategoryManagement categoryService={mockCategoryService as unknown as CategoryService} />
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
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
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Category created successfully',
      });
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
