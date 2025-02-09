import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryManagement } from '../components/CategoryManagement';
import { CategoryService } from '../api/categoryService';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from '~/components/ui/use-toast';

// Mock the toast component
vi.mock('~/components/ui/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

describe('CategoryManagement', () => {
  const mockCategories = [
    {
      id: '1',
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test Description',
      position: 0,
      is_active: true,
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
  } as unknown as CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryService.fetchCategories.mockResolvedValue(mockCategories);
    mockCategoryService.createCategory.mockResolvedValue(mockCategories[0]);
    mockCategoryService.updateCategory.mockResolvedValue(mockCategories[0]);
    mockCategoryService.deleteCategory.mockResolvedValue(undefined);
  });

  it('loads and displays categories on mount', async () => {
    render(<CategoryManagement categoryService={mockCategoryService} />);

    await waitFor(() => {
      expect(mockCategoryService.fetchCategories).toHaveBeenCalled();
    });

    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('opens create category dialog', async () => {
    render(<CategoryManagement categoryService={mockCategoryService} />);

    const addButton = screen.getByRole('button', { name: /add category/i });
    fireEvent.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Category')).toBeInTheDocument();
  });

  it('handles category creation successfully', async () => {
    render(<CategoryManagement categoryService={mockCategoryService} />);

    const addButton = screen.getByRole('button', { name: /add category/i });
    fireEvent.click(addButton);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'New Category' } });

    const submitButton = screen.getByRole('button', { name: /create category/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCategoryService.createCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Category' })
      );
    });
  });

  it('handles category update successfully', async () => {
    render(<CategoryManagement categoryService={mockCategoryService} />);

    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Category' } });

    const submitButton = screen.getByRole('button', { name: /update category/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ name: 'Updated Category' })
      );
    });
  });

  it('handles category deletion successfully', async () => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<CategoryManagement categoryService={mockCategoryService} />);

    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith('1');
    });
  });

  it('handles toggle category active status', async () => {
    render(<CategoryManagement categoryService={mockCategoryService} />);

    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    const toggleSwitch = screen.getByRole('switch');
    fireEvent.click(toggleSwitch);

    await waitFor(() => {
      expect(mockCategoryService.updateCategory).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ is_active: false })
      );
    });
  });

  it('displays error toast on fetch failure', async () => {
    const error = new Error('Failed to fetch categories');
    mockCategoryService.fetchCategories.mockRejectedValue(error);

    render(<CategoryManagement categoryService={mockCategoryService} />);

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
    render(<CategoryManagement categoryService={mockCategoryService} />);

    const addButton = screen.getByRole('button', { name: /add category/i });
    fireEvent.click(addButton);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'New Category' } });

    const submitButton = screen.getByRole('button', { name: /create category/i });
    fireEvent.click(submitButton);

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
    render(<CategoryManagement categoryService={mockCategoryService} />);

    const addButton = screen.getByRole('button', { name: /add category/i });
    fireEvent.click(addButton);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'New Category' } });

    const submitButton = screen.getByRole('button', { name: /create category/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
