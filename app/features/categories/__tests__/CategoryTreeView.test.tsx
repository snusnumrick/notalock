import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryTreeView } from '../components/CategoryTreeView';
import { Category } from '../types/category.types';

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Parent Category',
    slug: 'parent',
    sort_order: 1,
    is_visible: true,
    children: [
      {
        id: '2',
        name: 'Child Category',
        slug: 'child',
        sort_order: 1,
        is_visible: true,
        parent_id: '1',
      },
      {
        id: '3',
        name: 'Hidden Child',
        slug: 'hidden-child',
        sort_order: 2,
        is_visible: false,
        parent_id: '1',
      },
    ],
  },
  {
    id: '4',
    name: 'Another Parent',
    slug: 'another-parent',
    sort_order: 2,
    is_visible: true,
  },
];

describe('CategoryTreeView', () => {
  it('renders all categories in the correct hierarchy', () => {
    render(<CategoryTreeView categories={mockCategories} />);

    // Check parent categories
    expect(screen.getByTestId('category-1')).toHaveTextContent('Parent Category');
    expect(screen.getByTestId('category-4')).toHaveTextContent('Another Parent');

    // Check child categories
    expect(screen.getByTestId('category-2')).toHaveTextContent('Child Category');
    expect(screen.getByTestId('category-3')).toHaveTextContent('Hidden Child');
  });

  it('shows (Hidden) label for invisible categories', () => {
    render(<CategoryTreeView categories={mockCategories} />);
    const hiddenCategory = screen.getByTestId('category-3');
    expect(hiddenCategory).toHaveTextContent(/\(Hidden\)/);
  });

  it('expands and collapses categories on click', async () => {
    const user = userEvent.setup();
    render(<CategoryTreeView categories={mockCategories} />);

    // Get the parent category container
    const parentCategory = screen.getByTestId('category-1');
    const expandButton = within(parentCategory).getByRole('button');
    expect(expandButton).toBeTruthy();

    // Check initial state
    expect(screen.getByTestId('category-2')).toBeInTheDocument();

    // Collapse
    await user.click(expandButton!);
    await waitFor(() => {
      expect(screen.queryByTestId('category-2')).not.toBeInTheDocument();
    });

    // Expand again
    await user.click(expandButton!);
    await waitFor(() => {
      expect(screen.getByTestId('category-2')).toBeInTheDocument();
    });
  });

  it('calls onSelectCategory when a category is clicked', async () => {
    const user = userEvent.setup();
    const onSelectCategory = vi.fn();
    render(<CategoryTreeView categories={mockCategories} onSelectCategory={onSelectCategory} />);

    // Click parent category
    await user.click(screen.getByTestId('category-1'));
    expect(onSelectCategory).toHaveBeenCalledWith(mockCategories[0]);

    // Click child category
    await user.click(screen.getByTestId('category-2'));
    expect(onSelectCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2',
        name: 'Child Category',
        slug: 'child',
        sort_order: 1,
        is_visible: true,
        parent_id: '1',
      })
    );
  });

  it('applies highlight class to selected category', () => {
    render(<CategoryTreeView categories={mockCategories} selectedCategoryId="2" />);
    expect(screen.getByTestId('category-2')).toHaveClass('bg-blue-50');
  });

  it('renders empty state when no categories exist', () => {
    render(<CategoryTreeView categories={[]} />);
    expect(screen.getByText('No categories found')).toBeInTheDocument();
  });
});
