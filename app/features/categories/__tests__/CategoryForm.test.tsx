import { render, screen } from '@testing-library/react';
import { CategoryForm } from '../components/CategoryForm';
import userEvent from '@testing-library/user-event';
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

  it('handles parent category selection', async () => {
    const mockData = { id: '2', name: 'Test Category 2' };
    const mockCategories = [{ id: '1', name: 'Test Category 1' }];

    render(
      <CategoryForm onSubmit={mockOnSubmit} initialData={mockData} categories={mockCategories} />
    );

    // Find the select element and choose an option
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();

    await userEvent.selectOptions(selectElement, '1');
    expect(selectElement).toHaveValue('1');
  });

  it('updates active status correctly', async () => {
    const { activeSwitch, user } = await setup();
    await user.click(activeSwitch);
    expect(activeSwitch).toHaveAttribute('aria-checked', 'false');
  });
});
