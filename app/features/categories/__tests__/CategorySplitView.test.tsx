import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySplitView } from '../components/CategorySplitView';
import { Category } from '../types/category.types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    ],
  },
  {
    id: '3',
    name: 'Another Category',
    slug: 'another',
    sort_order: 2,
    is_visible: true,
  },
];

const mockHandlers = {
  onSelectCategory: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onToggleActive: vi.fn(),
  onReorder: vi.fn(),
};

describe('CategorySplitView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both tree view and list view on desktop', () => {
    render(<CategorySplitView categories={mockCategories} {...mockHandlers} />);

    // Both views should be visible in desktop layout with their headers
    expect(screen.getByText('Category Tree')).toBeInTheDocument();
    expect(screen.getByText('Category List')).toBeInTheDocument();
  });

  it('renders tabs on mobile view', () => {
    render(<CategorySplitView categories={mockCategories} {...mockHandlers} />);

    const treeTab = screen.getByRole('tab', { name: /Tree View/i });
    const listTab = screen.getByRole('tab', { name: /List View/i });

    expect(treeTab).toBeInTheDocument();
    expect(listTab).toBeInTheDocument();
  });

  it('handles category selection in tree view', async () => {
    const user = userEvent.setup();
    render(<CategorySplitView categories={mockCategories} {...mockHandlers} />);

    // Find and click the category by its name within the CategoryTreeView
    const category = screen.getByTestId('desktop-category-1');
    await user.click(category);
    expect(mockHandlers.onSelectCategory).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('highlights selected category', () => {
    render(
      <CategorySplitView categories={mockCategories} selectedCategoryId="2" {...mockHandlers} />
    );

    // Use the data-testid to find the category
    const selectedCategory = screen.getByTestId('desktop-category-2');
    expect(selectedCategory).toHaveClass('bg-blue-50');
  });

  it('renders all categories in the list view', () => {
    render(<CategorySplitView categories={mockCategories} {...mockHandlers} />);

    // Check that the categories are rendered in the list view specifically
    mockCategories.forEach(category => {
      const listViewElement = screen
        .getAllByTestId('category-name')
        .find(element => element.textContent === category.name);
      expect(listViewElement).toBeInTheDocument();
    });
  });
});
