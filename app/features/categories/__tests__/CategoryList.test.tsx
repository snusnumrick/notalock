import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryList } from '../components/CategoryList';
import { vi, describe, it, expect } from 'vitest';
import type { Category } from '../types/category.types';

describe('CategoryList', () => {
  const mockCategories: Category[] = [
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
    {
      id: '2',
      name: 'Another Category',
      slug: 'another-category',
      description: 'Another Description',
      position: 1,
      is_active: false,
      created_at: '2025-02-08T00:00:00Z',
      updated_at: '2025-02-08T00:00:00Z',
    },
  ];

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleActive = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
    mockOnToggleActive.mockClear();
  });

  it('renders categories correctly', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('Another Category')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('handles edit button click', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('handles delete button click', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockCategories[0].id);
  });

  it('handles toggle active state', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    expect(mockOnToggleActive).toHaveBeenCalledWith(mockCategories[0].id, false);
  });

  it('displays correct active status', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeChecked();
    expect(switches[1]).not.toBeChecked();
  });

  it('renders empty state correctly when no categories', () => {
    render(
      <CategoryList
        categories={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    const table = screen.getByRole('table');
    const rows = screen.queryAllByRole('row');
    expect(rows.length).toBe(1); // Only header row should be present
  });

  it('maintains sort order of categories', () => {
    const sortedCategories = [...mockCategories].sort((a, b) => a.position - b.position);

    render(
      <CategoryList
        categories={sortedCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    const rows = screen.getAllByRole('row').slice(1); // Skip header row
    expect(rows[0]).toHaveTextContent('Test Category');
    expect(rows[1]).toHaveTextContent('Another Category');
  });

  it('renders all category fields correctly', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleActive={mockOnToggleActive}
      />
    );

    const category = mockCategories[0];
    const row = screen.getAllByRole('row')[1]; // First data row

    expect(row).toHaveTextContent(category.name);
    expect(row).toHaveTextContent(category.description || '');
  });
});
