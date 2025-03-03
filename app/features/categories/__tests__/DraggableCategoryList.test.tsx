import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DraggableCategoryList } from '../components/DraggableCategoryList';
import type { Category } from '../types/category.types';

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Category 1',
    slug: 'category-1',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '2',
    name: 'Category 2',
    slug: 'category-2',
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: '3',
    name: 'Category 3',
    slug: 'category-3',
    sortOrder: 2,
    isVisible: false,
  },
];

describe('DraggableCategoryList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleActive = vi.fn();
  const mockOnReorder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all categories', () => {
    render(
      <DraggableCategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
        onReorder={mockOnReorder}
      />
    );

    mockCategories.forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <DraggableCategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
        onReorder={mockOnReorder}
      />
    );

    const editButtons = screen.getAllByLabelText('Edit category');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <DraggableCategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
        onReorder={mockOnReorder}
      />
    );

    const deleteButtons = screen.getAllByLabelText('Delete category');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockCategories[0].id);
  });

  it('calls onToggleActive when switch is clicked', () => {
    render(
      <DraggableCategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
        onReorder={mockOnReorder}
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggleActive).toHaveBeenCalledWith(mockCategories[0].id, false);
  });

  // Note: Testing drag and drop functionality would require more complex setup
  // with @testing-library/user-event and proper drag event simulation
});
