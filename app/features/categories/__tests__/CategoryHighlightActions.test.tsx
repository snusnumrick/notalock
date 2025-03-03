import { render, screen } from '@testing-library/react';
import { CategoryHighlightActions } from '../components/CategoryHighlightActions';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

describe('CategoryHighlightActions', () => {
  const mockOnHighlight = vi.fn();
  const mockOnUpdatePriority = vi.fn();

  const mockCategory = {
    id: '1',
    isHighlighted: true,
    highlightPriority: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders remove highlight button', () => {
    render(
      <CategoryHighlightActions
        selectedCategories={[mockCategory]}
        onHighlight={mockOnHighlight}
        onUpdatePriority={mockOnUpdatePriority}
      />
    );

    expect(screen.getByText('Remove from Highlights')).toBeInTheDocument();
  });

  it('renders adjust priority button', () => {
    render(
      <CategoryHighlightActions
        selectedCategories={[mockCategory]}
        onHighlight={mockOnHighlight}
        onUpdatePriority={mockOnUpdatePriority}
      />
    );

    expect(screen.getByRole('button', { name: /adjust priority/i })).toBeInTheDocument();
  });

  it('calls onHighlight when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryHighlightActions
        selectedCategories={[mockCategory]}
        onHighlight={mockOnHighlight}
        onUpdatePriority={mockOnUpdatePriority}
      />
    );

    await user.click(screen.getByText('Remove from Highlights'));
    expect(mockOnHighlight).toHaveBeenCalledWith(['1'], false);
  });

  it('calls onUpdatePriority with correct parameters when adjusting priority', async () => {
    const user = userEvent.setup();
    render(
      <CategoryHighlightActions
        selectedCategories={[mockCategory]}
        onHighlight={mockOnHighlight}
        onUpdatePriority={mockOnUpdatePriority}
      />
    );

    await user.click(screen.getByRole('button', { name: /adjust priority/i }));
    const menuItems = await screen.findAllByRole('menuitem');
    await user.click(menuItems[0]); // Click first menu item

    expect(mockOnUpdatePriority).toHaveBeenCalledWith('1', expect.any(Number));
  });
});
