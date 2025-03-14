/**
 * Diagnostic test to understand the structure of the ProductFilter component
 */
import { render, screen } from '@testing-library/react';
import { vi, describe, it } from 'vitest';
import ProductFilter from '../ProductFilter';

// Mock React hooks
vi.mock('@remix-run/react', () => ({
  useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  useLocation: vi.fn(() => ({ pathname: '/products' })),
  useSubmit: vi.fn(() => vi.fn()),
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('ProductFilter Component Structure', () => {
  it('logs all rendered buttons and their attributes', () => {
    // Render with active filters to ensure reset button should be visible
    const { container } = render(
      <ProductFilter
        onFilterChange={() => {}}
        categories={[
          { id: 'cat1', name: 'Category 1', slug: 'category-1' },
          { id: 'cat2', name: 'Category 2', slug: 'category-2' },
        ]}
        defaultFilters={{
          categoryId: 'cat1',
          minPrice: 10,
          maxPrice: 100,
          inStockOnly: true,
        }}
      />
    );

    // Log the entire DOM for inspection
    console.log('FULL RENDERED DOM:', container.innerHTML);

    // Log all buttons
    const allButtons = screen.getAllByRole('button');
    console.log(`Found ${allButtons.length} total buttons:`);

    allButtons.forEach((button, index) => {
      console.log(`Button ${index + 1}:`);
      console.log('  Text content:', button.textContent);
      console.log('  Class names:', button.className);
      console.log('  Type:', button.getAttribute('type'));
      console.log('  Role:', button.getAttribute('role'));
      console.log('  data-testid:', button.getAttribute('data-testid'));
      console.log('  Outer HTML:', button.outerHTML);
      console.log('---');
    });

    // Check specifically for reset buttons that mention "Reset all filters"
    const resetButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.textContent && btn.textContent.includes('Reset all filters'));

    console.log(`Found ${resetButtons.length} reset buttons:`);
    resetButtons.forEach((button, index) => {
      console.log(`Reset button ${index + 1}:`);
      console.log('  data-testid:', button.getAttribute('data-testid'));
      console.log('  Full HTML:', button.outerHTML);
    });

    // Check specifically for elements with data-testid
    const elementsWithTestId = screen.queryAllByTestId(/.*/);
    console.log(`Found ${elementsWithTestId.length} elements with data-testid:`);

    elementsWithTestId.forEach((el, index) => {
      console.log(`Element ${index + 1} with data-testid:`);
      console.log('  data-testid:', el.getAttribute('data-testid'));
      console.log('  Tag name:', el.tagName.toLowerCase());
      console.log('  Text content:', el.textContent);
      console.log('  Full HTML:', el.outerHTML);
    });
  });
});
