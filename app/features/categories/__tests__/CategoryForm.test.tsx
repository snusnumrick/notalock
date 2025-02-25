import { render, screen } from '@testing-library/react';
import { CategoryForm } from '../components/CategoryForm';
import userEvent from '@testing-library/user-event';
import type { Category } from '../types/category.types';
import { vi } from 'vitest';

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();

  const setup = async () => {
    const user = userEvent.setup();
    const utils = render(<CategoryForm onSubmit={mockOnSubmit} />);
    const button = screen.getByRole('button', { name: /create category/i });
    const nameInput = await screen.findByLabelText(/^name$/i);
    const slugInput = await screen.findByLabelText(/slug/i);
    const descInput = await screen.findByLabelText(/description/i);
    const activeSwitch = await screen.findByRole('switch', { name: /active/i });
    const highlightSwitch = await screen.findByRole('switch', { name: /highlight/i });

    return {
      user,
      button,
      nameInput,
      slugInput,
      descInput,
      activeSwitch,
      highlightSwitch,
      ...utils,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty form correctly', async () => {
    const { nameInput, slugInput, descInput, activeSwitch, highlightSwitch } = await setup();

    expect(nameInput).toBeInTheDocument();
    expect(slugInput).toBeInTheDocument();
    expect(descInput).toBeInTheDocument();
    expect(activeSwitch).toBeInTheDocument();
    expect(highlightSwitch).toBeInTheDocument();
  });

  it('renders form with initial data', async () => {
    const initialData = {
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test Description',
      is_visible: true,
      is_highlighted: false,
    };

    render(<CategoryForm onSubmit={mockOnSubmit} initialData={initialData} />);

    const nameInput = await screen.findByLabelText(/^name$/i);
    const slugInput = await screen.findByLabelText(/slug/i);
    const descInput = await screen.findByLabelText(/description/i);

    expect(nameInput).toHaveValue('Test Category');
    expect(slugInput).toHaveValue('test-category');
    expect(descInput).toHaveValue('Test Description');
  });

  it('validates required fields', async () => {
    const { button, user } = await setup();
    await user.click(button);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const { nameInput, button, user } = await setup();
    await user.type(nameInput, 'Test Category');
    await user.click(button);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('renders parent category select when categories are provided', () => {
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Test Category 1',
        slug: 'test-category-1',
        position: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sort_order: 0,
        is_visible: true,
        status: 'active',
        is_highlighted: false,
        highlight_priority: 0,
      },
      {
        id: '2',
        name: 'Test Category 2',
        slug: 'test-category-2',
        position: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sort_order: 0,
        is_visible: true,
        status: 'active',
        is_highlighted: false,
        highlight_priority: 0,
      },
    ];

    render(<CategoryForm onSubmit={mockOnSubmit} categories={mockCategories} />);

    // Check if the select trigger button exists
    const selectTrigger = screen.getByRole('combobox', { name: /parent category/i });
    expect(selectTrigger).toBeInTheDocument();
  });

  it('updates active status correctly', async () => {
    const { activeSwitch, user } = await setup();
    await user.click(activeSwitch);
    expect(activeSwitch).toHaveAttribute('aria-checked', 'false');
  });
});
