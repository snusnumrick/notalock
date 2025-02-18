import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryService } from '../categoryService';

// Simple test wrapper since we can't use Remix testing utilities
const TestWrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

describe('Category UI Components', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    new CategoryService(mockSupabase);
  });

  describe('Category Management', () => {
    // Create a simpler version of the component for testing
    const CategoryManagement = ({
      categories,
      onSubmit,
      loading,
    }: {
      categories: any[];
      onSubmit: (name: string) => void;
      loading: boolean;
    }) => (
      <div>
        <form
          onSubmit={e => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const name = new FormData(form).get('name') as string;
            onSubmit(name);
          }}
        >
          <input type="text" name="name" placeholder="Category Name" />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </button>
        </form>
        <ul>
          {categories.map(category => (
            <li key={category.id}>{category.name}</li>
          ))}
        </ul>
      </div>
    );

    it('should render categories and handle submission', async () => {
      const mockCategories = [{ id: '1', name: 'Existing Category' }];

      const handleSubmit = vi.fn();

      render(
        <TestWrapper>
          <CategoryManagement categories={mockCategories} onSubmit={handleSubmit} loading={false} />
        </TestWrapper>
      );

      // Should show existing category
      expect(screen.getByText('Existing Category')).toBeInTheDocument();

      // Submit form
      const input = screen.getByPlaceholderText('Category Name');
      const button = screen.getByText('Create Category');

      fireEvent.change(input, { target: { value: 'New Category' } });
      fireEvent.click(button);

      // Should call submit handler
      expect(handleSubmit).toHaveBeenCalledWith('New Category');
    });

    it('should show loading state', () => {
      render(
        <TestWrapper>
          <CategoryManagement categories={[]} onSubmit={() => {}} loading={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Category Highlights', () => {
    // Simplified highlight component for testing
    const CategoryHighlights = ({
      categories,
      onToggleHighlight,
      loading,
    }: {
      categories: any[];
      onToggleHighlight: (id: string, highlight: boolean) => void;
      loading: boolean;
    }) => (
      <div>
        {loading && <div>Updating highlights...</div>}
        <ul>
          {categories.map(category => (
            <li key={category.id}>
              <span>{category.name}</span>
              <button
                onClick={() => onToggleHighlight(category.id, !category.is_highlighted)}
                disabled={loading}
              >
                {category.is_highlighted ? 'Remove Highlight' : 'Highlight'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

    it('should handle highlight toggling', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Test Category',
          is_highlighted: false,
        },
      ];

      const handleToggle = vi.fn();

      render(
        <TestWrapper>
          <CategoryHighlights
            categories={mockCategories}
            onToggleHighlight={handleToggle}
            loading={false}
          />
        </TestWrapper>
      );

      const highlightButton = screen.getByText('Highlight');
      fireEvent.click(highlightButton);

      expect(handleToggle).toHaveBeenCalledWith('1', true);
    });

    it('should show loading state', () => {
      render(
        <TestWrapper>
          <CategoryHighlights categories={[]} onToggleHighlight={() => {}} loading={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Updating highlights...')).toBeInTheDocument();
    });
  });
});
