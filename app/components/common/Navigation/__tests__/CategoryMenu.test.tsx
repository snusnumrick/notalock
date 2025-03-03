import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import CategoryMenu from '../CategoryMenu';

// Create mock categories data for testing
const mockCategories = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices',
    children: [
      {
        id: 'phones',
        name: 'Phones',
        slug: 'phones',
        description: 'Mobile phones',
        children: [],
      },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing',
    slug: 'clothing',
    description: 'Apparel',
    children: [],
  },
];

// Mock shadcn NavigationMenu components
vi.mock('@/components/ui/navigation-menu', () => ({
  NavigationMenu: ({ children, className }) => (
    <nav className={className} data-testid="navigation-menu">
      {children}
    </nav>
  ),
  NavigationMenuList: ({ children }) => <ul>{children}</ul>,
  NavigationMenuItem: ({ children }) => <li>{children}</li>,
  NavigationMenuTrigger: ({ children }) => <button>{children}</button>,
  NavigationMenuContent: ({ children }) => <div data-testid="navigation-content">{children}</div>,
  NavigationMenuLink: ({ asChild, children }) =>
    asChild ? (
      children
    ) : (
      <button type="button" className="text-inherit">
        {children}
      </button>
    ),
  navigationMenuTriggerStyle: () => 'menu-trigger-style',
}));

describe('CategoryMenu', () => {
  it('renders all top-level categories', () => {
    render(
      <MemoryRouter>
        <CategoryMenu
          categories={mockCategories.map(cat => ({
            ...cat,
            parentId: null, // Ensure parentId is set to null for root categories
          }))}
        />
      </MemoryRouter>
    );

    // Check for top-level categories
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(
      <MemoryRouter>
        <CategoryMenu
          className="custom-class"
          categories={mockCategories.map(cat => ({
            ...cat,
            parentId: null,
          }))}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigation-menu')).toHaveClass('custom-class');
  });
});
