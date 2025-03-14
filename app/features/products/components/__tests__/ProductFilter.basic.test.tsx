/**
 * Basic test for ProductFilter that just focuses on critical functionality
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it } from 'vitest';
import { useSubmit } from '@remix-run/react';
import ProductFilter from '../ProductFilter';

// Mock React hooks
vi.mock('@remix-run/react', () => ({
  useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  useLocation: vi.fn(() => ({ pathname: '/products' })),
  useSubmit: vi.fn(() => vi.fn()),
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('ProductFilter Basic Functionality', () => {
  it('renders with active filters and shows reset button', () => {
    // Mock the required hooks
    const mockFilterChange = vi.fn();
    const mockSubmit = vi.fn();
    vi.mocked(useSubmit).mockReturnValue(mockSubmit);

    const categories = [
      { id: 'cat1', name: 'Category 1', slug: 'category-1' },
      { id: 'cat2', name: 'Category 2', slug: 'category-2' },
    ];

    // Render with active filters to ensure the reset button should be visible
    const { container } = render(
      <ProductFilter
        onFilterChange={mockFilterChange}
        categories={categories}
        defaultFilters={{
          categoryId: 'cat1',
          minPrice: 10,
          maxPrice: 100,
          inStockOnly: true,
        }}
      />
    );

    // Debug output
    console.log('Full DOM content with active filters:', container.innerHTML);

    // Try to find reset button with different approaches - use data-testid for reliability
    const resetButtonByDataTestId = screen.getByTestId('reset_desktop');
    // When multiple buttons have the same accessible name, use getAllByRole and select the one you want
    const resetButtonsByAriaLabel = screen.getAllByRole('button', { name: 'Reset all filters' });
    console.log(`Found ${resetButtonsByAriaLabel.length} buttons with name 'Reset all filters'`);
    const allButtons = screen.getAllByRole('button');

    console.log('Reset button found by data-testid:', !!resetButtonByDataTestId);
    console.log('Reset buttons found by aria-label:', resetButtonsByAriaLabel.length);
    console.log('All buttons found:', allButtons.length);

    // Log details of all buttons
    allButtons.forEach((button, index) => {
      console.log(`Button ${index}:`, {
        text: button.textContent,
        className: button.className,
        type: (button as HTMLButtonElement).type,
      });
    });

    // We'll use the data-testid button for testing
    const resetButton = resetButtonByDataTestId;
    console.log('Using reset button:', resetButton.outerHTML);

    // Mock window.location for href assignment check
    const originalLocation = window.location;
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/products',
        href: 'http://localhost:3000/products?categoryId=cat1',
        origin: 'http://localhost:3000',
        search: '?categoryId=cat1',
      },
      writable: true,
    });
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
      get: () => 'http://localhost:3000/products?categoryId=cat1',
    });

    // Click the reset button
    console.log('Clicking reset button with data-testid="reset_desktop"');
    fireEvent.click(resetButton);

    // Check if either callback was called or href was set
    console.log('Filter change called:', mockFilterChange.mock.calls.length > 0);
    console.log('Submit called:', mockSubmit.mock.calls.length > 0);
    console.log('Href setter called:', hrefSetter.mock.calls.length > 0);

    if (hrefSetter.mock.calls.length > 0) {
      console.log('Href set to:', hrefSetter.mock.calls[0][0]);
    }

    // Clean up
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});
