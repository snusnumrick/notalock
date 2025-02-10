import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../components/CategoryForm';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Category } from '../types/category.types';

describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn().mockImplementation(() => Promise.resolve());

  const setup = async () => {
    const user = userEvent.setup({ delay: null });
    const utils = render(<CategoryForm onSubmit={mockOnSubmit} />);

    // Wait for all form elements
    const button = await screen.findByRole('button', { name: /create category/i });
    const nameInput = await screen.findByLabelText(/name/i);
    const slugInput = await screen.findByLabelText(/slug/i);
    const descInput = await screen.findByLabelText(/description/i);
    const switchInput = await screen.findByRole('switch');

    return { user, button, nameInput, slugInput, descInput, switchInput, ...utils };
  };

  const setupWithData = async (categories?: Category[]) => {
    const user = userEvent.setup({ delay: null });
    const utils = render(<CategoryForm onSubmit={mockOnSubmit} categories={categories ?? []} />);

    // Wait for all form elements
    const button = await screen.findByRole('button', { name: /create category/i });
    const nameInput = await screen.findByLabelText(/name/i);
    const slugInput = await screen.findByLabelText(/slug/i);
    const descInput = await screen.findByLabelText(/description/i);
    const switchInput = await screen.findByRole('switch');
    const combobox = categories ? await screen.findByRole('combobox') : null;

    return { user, button, nameInput, slugInput, descInput, switchInput, combobox, ...utils };
  };

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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders empty form correctly', async () => {
    const { button, nameInput, slugInput, descInput, switchInput } = await setup();

    expect(button).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
    expect(slugInput).toBeInTheDocument();
    expect(descInput).toBeInTheDocument();
    expect(switchInput).toBeInTheDocument();
  });

  it('renders form with initial data', async () => {
    render(<CategoryForm initialData={mockCategories[0]} onSubmit={mockOnSubmit} />);

    const nameInput = await screen.findByLabelText(/name/i);
    const slugInput = await screen.findByLabelText(/slug/i);

    expect(nameInput).toHaveValue('Test Category');
    expect(slugInput).toHaveValue('test-category');
  });

  it('validates required fields', async () => {
    const { user, button } = await setup();

    await act(async () => {
      await user.click(button);
    });

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const { user, button, nameInput, slugInput } = await setup();

    // Fill form
    await user.type(nameInput, 'New Category');
    await user.type(slugInput, 'new-category');

    // Submit and verify
    await act(async () => {
      await user.click(button);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'New Category',
      slug: 'new-category',
      description: '',
      parent_id: '',
      sort_order: 0,
      is_visible: true,
    });
  });

  it('handles parent category selection', async () => {
    const { user, button, nameInput, combobox } = await setupWithData(mockCategories);

    // Fill form and submit
    await act(async () => {
      if (combobox) {
        await user.selectOptions(combobox, '1');
      }
      await user.type(nameInput, 'Child Category');
      await user.click(button);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Child Category',
      slug: '',
      description: '',
      parent_id: '1',
      sort_order: 0,
      is_visible: true,
    });
  });

  it('updates active status correctly', async () => {
    const { user, button, nameInput, switchInput } = await setup();

    // Fill form
    await user.type(nameInput, 'Test Category');

    // Toggle switch and submit
    await act(async () => {
      await user.click(switchInput);
      await user.click(button);
    });

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
