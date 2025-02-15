import { render, screen, waitFor } from '@testing-library/react';
import { CategoryManagement } from '../components/CategoryManagement';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CategoryService } from '@/services/CategoryService';
import { Toaster } from '~/components/ui/toaster';

// Mock CategoryService
const categoryService = {
  fetchCategories: vi.fn(),
  fetchHighlightedCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  updatePositions: vi.fn(),
  updateHighlightStatus: vi.fn(),
  updateHighlightPriority: vi.fn(),
} as unknown as CategoryService;

describe('CategoryManagement', () => {
  const renderWithToaster = (ui: React.ReactElement) => {
    return render(
      <>
        {ui}
        <Toaster />
      </>
    );
  };

  // Helper to wait for toast
  const waitForToast = async (toastMessage: RegExp | string) => {
    await waitFor(() => {
      // Look for either toast-title or toast-description
      const toastElement = screen.getByText(toastMessage);
      expect(toastElement).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    categoryService.fetchCategories.mockResolvedValue([
      { id: '1', name: 'Category 1', is_highlighted: false },
      { id: '2', name: 'Category 2', is_highlighted: false },
    ]);
    categoryService.fetchHighlightedCategories.mockResolvedValue([]);
  });

  it('shows category highlight form fields when editing highlighted category', async () => {
    renderWithToaster(<CategoryManagement categoryService={categoryService} />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
    });

    // Click on the category
    const category = screen.getByTestId('desktop-category-1');
    await userEvent.click(category);

    // Verify form dialog is shown
    expect(screen.getByText(/Edit Category/)).toBeInTheDocument();
    expect(screen.getByLabelText(/highlight on homepage/i)).toBeInTheDocument();
  });

  it('shows bulk highlight actions when categories are selected', async () => {
    renderWithToaster(<CategoryManagement categoryService={categoryService} />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
    });

    // Select the category using the checkbox
    const selectCheckbox = await screen.findByRole('checkbox', { name: /select category 1/i });
    await userEvent.click(selectCheckbox);

    expect(screen.getByRole('button', { name: /add to highlights/i })).toBeInTheDocument();
  });

  it('handles highlight status updates', async () => {
    renderWithToaster(<CategoryManagement categoryService={categoryService} />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
    });

    // Select the category using the checkbox
    const selectCheckbox = await screen.findByRole('checkbox', { name: /select category 1/i });
    await userEvent.click(selectCheckbox);

    // Wait for and find the button
    const addButton = await screen.findByRole('button', { name: /add to highlights/i });
    await userEvent.click(addButton);

    expect(categoryService.updateHighlightStatus).toHaveBeenCalledWith(['1'], true);

    // Wait for success message
    await waitForToast(/added to highlights successfully/i);
  });

  it('handles highlight priority updates', async () => {
    categoryService.fetchCategories.mockResolvedValue([
      {
        id: '1',
        name: 'Category 1',
        is_highlighted: true,
        highlight_priority: 1,
        is_visible: true,
        description: 'Test Category',
      },
    ]);

    renderWithToaster(<CategoryManagement categoryService={categoryService} />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
    });

    // Click the category
    const category = screen.getByTestId('desktop-category-1');
    await userEvent.click(category);

    // Find priority field and update it
    const priorityInput = await screen.findByLabelText(/^display priority/i);
    await userEvent.clear(priorityInput);
    await userEvent.type(priorityInput, '2');

    // Submit form
    const updateButton = screen.getByRole('button', { name: /update category/i });
    await userEvent.click(updateButton);

    // Verify the categoryService updateCategory was called with correct data
    expect(categoryService.updateCategory).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        highlight_priority: 2,
      })
    );

    // Verify success toast
    await waitForToast(/updated successfully/i);
  });

  it('handles errors during highlight operations', async () => {
    categoryService.updateHighlightStatus.mockRejectedValueOnce(new Error('Update failed'));

    renderWithToaster(<CategoryManagement categoryService={categoryService} />);

    await waitFor(() => {
      expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
    });

    // Select the category using the checkbox
    const selectCheckbox = await screen.findByRole('checkbox', { name: /select category 1/i });
    await userEvent.click(selectCheckbox);

    // Wait for and find the button
    const addButton = await screen.findByRole('button', { name: /add to highlights/i });
    await userEvent.click(addButton);

    // Verify toast error message appears
    await waitForToast(/failed to update highlight status/i);
  });
});
