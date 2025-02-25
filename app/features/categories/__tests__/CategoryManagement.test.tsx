import { render, screen, waitFor, within } from '@testing-library/react';
import { CategoryManagement } from '../components/CategoryManagement';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CategoryService } from '../services/categoryService';
import { Toaster } from '~/components/ui/toaster';
import type { Category } from '../types/category.types';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

// Mock data constants
const mockCategories: Partial<Category>[] = [
  {
    id: '1',
    name: 'Category 1',
    is_highlighted: false,
    is_visible: true,
    description: 'Test Category 1',
    sort_order: 0,
    highlight_priority: 0,
  },
  {
    id: '2',
    name: 'Category 2',
    is_highlighted: false,
    is_visible: true,
    description: 'Test Category 2',
    sort_order: 1,
    highlight_priority: 0,
  },
] as Category[];

const mockHighlightedCategory: Partial<Category> = {
  id: '1',
  name: 'Category 1',
  is_highlighted: true,
  highlight_priority: 1,
  is_visible: true,
  description: 'Test Category',
  sort_order: 0,
} as Category;

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
} as unknown as SupabaseClient;

// Mock session
const mockSession: Session = {
  user: {
    id: 'test-user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
  },
  access_token: 'test-token',
  refresh_token: 'test-refresh-token',
  expires_at: 123456789,
  expires_in: 3600,
  token_type: 'bearer',
};

describe('CategoryManagement', () => {
  let categoryService: CategoryService;

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
      const toastElement = screen.getByText(toastMessage);
      expect(toastElement).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    categoryService = new CategoryService(mockSupabaseClient, mockSession);

    // Mock the service methods
    vi.spyOn(categoryService, 'fetchCategories').mockResolvedValue(mockCategories as Category[]);
    vi.spyOn(categoryService, 'updateHighlightStatus').mockResolvedValue();
    vi.spyOn(categoryService, 'updateHighlightPriority').mockResolvedValue();
  });

  describe('Category highlighting', () => {
    it('shows category highlight form fields when editing highlighted category', async () => {
      const user = userEvent.setup();
      renderWithToaster(<CategoryManagement categoryService={categoryService} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
      });

      // Click on the category
      const category = screen.getByTestId('desktop-category-1');
      await user.click(category);

      // Find form and verify highlight fields
      const form = await screen.findByRole('form', { name: /update category/i });
      expect(form).toBeInTheDocument();

      const highlightSwitch = within(form).getByRole('switch', { name: /highlight on homepage/i });
      expect(highlightSwitch).toBeInTheDocument();
    });

    it('shows bulk highlight actions when categories are selected', async () => {
      const user = userEvent.setup();
      renderWithToaster(<CategoryManagement categoryService={categoryService} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
      });

      // Select the category
      const selectCheckbox = await screen.findByRole('checkbox', { name: /select category 1/i });
      await user.click(selectCheckbox);

      // Verify highlight actions are shown
      const highlightButton = screen.getByRole('button', { name: /add to highlights/i });
      expect(highlightButton).toBeInTheDocument();
    });

    it('handles highlight status updates successfully', async () => {
      const user = userEvent.setup();
      renderWithToaster(<CategoryManagement categoryService={categoryService} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
      });

      // Select and update category
      const selectCheckbox = await screen.findByRole('checkbox', { name: /select category 1/i });
      await user.click(selectCheckbox);

      const addButton = await screen.findByRole('button', { name: /add to highlights/i });
      await user.click(addButton);

      // Verify service call and success message
      expect(categoryService.updateHighlightStatus).toHaveBeenCalledWith(['1'], true);
      await waitForToast(/added to highlights successfully/i);
    });

    it('handles highlight priority updates successfully', async () => {
      const user = userEvent.setup();
      vi.spyOn(categoryService, 'fetchCategories').mockResolvedValue([
        mockHighlightedCategory as Category,
      ]);

      renderWithToaster(<CategoryManagement categoryService={categoryService} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
      });

      // Select category and update priority
      const selectCheckbox = await screen.findByRole('checkbox', { name: /select category 1/i });
      await user.click(selectCheckbox);

      const priorityButton = screen.getByRole('button', { name: /adjust priority/i });
      await user.click(priorityButton);

      const increaseOption = screen.getByRole('menuitem', { name: /increase priority \(\+1\)/i });
      await user.click(increaseOption);

      // Verify service call and success message
      expect(categoryService.updateHighlightPriority).toHaveBeenCalledWith('1', 2);
      await waitForToast(/priority updated successfully/i);
    });

    it('handles errors during highlight operations', async () => {
      const user = userEvent.setup();
      vi.spyOn(categoryService, 'updateHighlightStatus').mockRejectedValueOnce(
        new Error('Update failed')
      );

      renderWithToaster(<CategoryManagement categoryService={categoryService} />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('desktop-category-1')).toBeInTheDocument();
      });

      // Select category and attempt update
      const selectCheckbox = await screen.findByRole('checkbox', { name: /select category 1/i });
      await user.click(selectCheckbox);

      const addButton = await screen.findByRole('button', { name: /add to highlights/i });
      await user.click(addButton);

      // Verify error message
      await waitForToast(/failed to update highlight status/i);
    });
  });
});
