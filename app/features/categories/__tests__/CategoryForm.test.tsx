import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../components/CategoryForm';
import { vi, describe, it, expect } from 'vitest';
import { Category } from '../types/category.types';

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Test Category',
      slug: 'test-category',
      sort_order: 0,
      is_visible: true,
      created_at: '2025-02-08T00:00:00Z',
      updated_at: '2025-02-08T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders empty form correctly', () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders form with initial data', () => {
    render(<CategoryForm initialData={mockCategories[0]} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('Test Category');
    expect(screen.getByLabelText(/slug/i)).toHaveValue('test-category');
  });

  it('validates required fields', async () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: 'Create Category' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'New Category');
    await userEvent.type(screen.getByLabelText(/slug/i), 'new-category');

    const submitButton = screen.getByRole('button', { name: 'Create Category' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Category',
        slug: 'new-category',
        description: '',
        parent_id: '',
        sort_order: 0,
        is_visible: true,
      });
    });
  });

  it('handles parent category selection', async () => {
    render(<CategoryForm onSubmit={mockOnSubmit} categories={mockCategories} />);

    const parentSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(parentSelect, '1');

    await userEvent.type(screen.getByLabelText(/name/i), 'Child Category');

    const submitButton = screen.getByRole('button', { name: 'Create Category' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Child Category',
        slug: '',
        description: '',
        parent_id: '1',
        sort_order: 0,
        is_visible: true,
      });
    });
  });

  it('updates active status correctly', async () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);

    const activeSwitch = screen.getByRole('switch');
    await userEvent.click(activeSwitch);

    await userEvent.type(screen.getByLabelText(/name/i), 'Test Category');

    const submitButton = screen.getByRole('button', { name: 'Create Category' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Category',
        slug: '',
        description: '',
        parent_id: '',
        sort_order: 0,
        is_visible: false,
      });
    });
  });
});
