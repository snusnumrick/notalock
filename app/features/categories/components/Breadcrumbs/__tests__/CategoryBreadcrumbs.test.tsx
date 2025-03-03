import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CategoryBreadcrumbs from '../CategoryBreadcrumbs';
import { useLocation, useMatches } from '@remix-run/react';
import {
  getReferringCategory,
  clearReferringCategory,
} from '~/features/categories/utils/referringCategoryUtils';

// Mock the referring category utils
vi.mock('~/features/categories/utils/referringCategoryUtils', () => ({
  getReferringCategory: vi.fn(),
  clearReferringCategory: vi.fn(),
}));

// Mock React Router hooks for tests
vi.mock('@remix-run/react', async () => {
  const actual = await vi.importActual('@remix-run/react');
  return {
    ...actual,
    useLocation: vi.fn(),
    useMatches: vi.fn().mockReturnValue([
      { id: 'root', data: {} },
      {
        id: 'routes/products',
        data: { currentCategory: { name: 'Electronics', slug: 'electronics' } },
      },
    ]),
    Link: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Mock the categories data
vi.mock('~/data/categories', () => ({
  categories: [
    {
      id: 'electronics',
      name: 'Electronics',
      slug: 'electronics',
      children: [
        {
          id: 'phones',
          name: 'Phones',
          slug: 'phones',
          children: [
            {
              id: 'smartphones',
              name: 'Smartphones',
              slug: 'smartphones',
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'clothing',
      name: 'Clothing',
      slug: 'clothing',
      children: [],
    },
    {
      id: 'premium',
      name: 'Premium',
      slug: 'premium',
      children: [],
    },
  ],
}));

// Mock the categories utils
vi.mock('~/features/categories/utils/categoryUtils', () => ({
  findCategoryBySlug: (slug: string) => {
    if (slug === 'electronics') {
      return { id: 'electronics', name: 'Electronics', slug: 'electronics' };
    } else if (slug === 'phones') {
      return { id: 'phones', name: 'Phones', slug: 'phones' };
    } else if (slug === 'premium') {
      return { id: 'premium', name: 'Premium', slug: 'premium' };
    }
    return null;
  },
  getCategoryPath: (slug: string) => {
    if (slug === 'phones') {
      return ['electronics', 'phones'];
    }
    return [slug];
  },
}));

vi.mock('~/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <nav className={className} aria-label="Breadcrumb" data-testid="breadcrumb">
      {children}
    </nav>
  ),
  BreadcrumbList: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  BreadcrumbItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  BreadcrumbLink: ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) =>
    asChild ? (
      children
    ) : (
      <button type="button" className="text-blue-600 hover:underline">
        {children}
      </button>
    ),
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="current-page">{children}</span>
  ),
  BreadcrumbSeparator: () => <span>/</span>,
}));

// Mock the ChevronRight icon
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-icon">&gt;</span>,
}));

describe('CategoryBreadcrumbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useMatches).mockReturnValue([
      { id: 'root', pathname: '/', params: {}, handle: undefined, data: {} },
      {
        id: 'routes/products',
        pathname: '/products',
        params: {},
        handle: undefined,
        data: { currentCategory: { name: 'Electronics', slug: 'electronics' } },
      },
    ]);

    // Reset referring category mock
    vi.mocked(getReferringCategory).mockReturnValue(null);
  });

  it('renders breadcrumbs for category page', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/category/electronics',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    render(<CategoryBreadcrumbs />);

    // Check for breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getAllByText(/Electronics/).length).toBeGreaterThan(0);

    // Check for current page marker
    expect(screen.getByTestId('current-page')).toHaveTextContent('Electronics');
  });

  it('renders breadcrumbs for products page with category filter', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products',
      search: '?categoryId=electronics',
      hash: '',
      state: null,
      key: 'default',
    });

    render(<CategoryBreadcrumbs />);

    // Check for breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getAllByText(/Electronics/).length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs for nested category', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/category/electronics/phones',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // Mock the matches with the current category
    vi.mocked(useMatches).mockReturnValue([
      { id: 'root', pathname: '/', params: {}, handle: undefined, data: {} },
      {
        id: 'routes/products',
        pathname: '/products',
        params: {},
        handle: undefined,
        data: { currentCategory: { name: 'Phones', slug: 'phones' } },
      },
    ]);

    // For nested categories, we have currentCategory=Phones but we also need to show Electronics in the path
    render(<CategoryBreadcrumbs />);

    // Check for breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();

    // For nested categories, we rely on the utils to build the full hierarchy
    expect(screen.getAllByText(/Electronics|Phones/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('current-page')).toHaveTextContent('Phones');
  });

  it('renders product page breadcrumbs without referring category', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/milano-premium-handle',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // Mock the matches with the current product
    vi.mocked(useMatches).mockReturnValue([
      { id: 'root', pathname: '/', params: {}, handle: undefined, data: {} },
      {
        id: 'routes/products.$slug',
        pathname: '/products/milano-premium-handle',
        params: { slug: 'milano-premium-handle' },
        handle: undefined,
        data: {
          currentProduct: { name: 'Milano Premium Handle', slug: 'milano-premium-handle' },
        },
      },
    ]);

    render(<CategoryBreadcrumbs />);

    // Check for breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByTestId('current-page')).toHaveTextContent('Milano Premium Handle');

    // Should not show any category in between
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });

  it('renders product page breadcrumbs with referring category', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/milano-premium-handle',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // Mock the matches with the current product
    vi.mocked(useMatches).mockReturnValue([
      { id: 'root', pathname: '/', params: {}, handle: undefined, data: {} },
      {
        id: 'routes/products.$slug',
        pathname: '/products/milano-premium-handle',
        params: { slug: 'milano-premium-handle' },
        handle: undefined,
        data: {
          currentProduct: { name: 'Milano Premium Handle', slug: 'milano-premium-handle' },
        },
      },
    ]);

    // Mock the referring category
    vi.mocked(getReferringCategory).mockReturnValue({
      id: 'premium',
      name: 'Premium',
      slug: 'premium',
    });

    render(<CategoryBreadcrumbs />);

    // Check for breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();

    // Should now show the referring category
    expect(screen.getByText('Premium')).toBeInTheDocument();

    // And the product name
    expect(screen.getByTestId('current-page')).toHaveTextContent('Milano Premium Handle');
  });

  it('renders product page breadcrumbs with nested referring category', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/smartphone-x',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // Mock the matches with the current product
    vi.mocked(useMatches).mockReturnValue([
      { id: 'root', pathname: '/', params: {}, handle: undefined, data: {} },
      {
        id: 'routes/products.$slug',
        pathname: '/products/smartphone-x',
        params: { slug: 'smartphone-x' },
        handle: undefined,
        data: {
          currentProduct: { name: 'Smartphone X', slug: 'smartphone-x' },
        },
      },
    ]);

    // Mock the referring category as a nested one (phones within electronics)
    vi.mocked(getReferringCategory).mockReturnValue({
      id: 'phones',
      name: 'Phones',
      slug: 'phones',
      path: '/products/category/electronics/phones',
    });

    render(<CategoryBreadcrumbs />);

    // Check for breadcrumb items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();

    // Should show the full category path
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Phones')).toBeInTheDocument();

    // And the product name
    expect(screen.getByTestId('current-page')).toHaveTextContent('Smartphone X');
  });

  it('clears referring category when navigating away from product pages', () => {
    // Mock the location to a non-product page
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    render(<CategoryBreadcrumbs />);

    // Should have called clearReferringCategory
    expect(clearReferringCategory).toHaveBeenCalled();
  });

  it('applies custom className when provided', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/category/electronics',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    render(<CategoryBreadcrumbs className="custom-class" />);

    expect(screen.getByTestId('breadcrumb')).toHaveClass('custom-class');
  });

  it('does not render on homepage', () => {
    // Mock the location
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // Reset useMatches mock for homepage
    vi.mocked(useMatches).mockReturnValue([
      {
        id: 'root',
        pathname: '/',
        params: {},
        handle: undefined,
        data: {},
      },
    ]);

    render(<CategoryBreadcrumbs />);

    expect(screen.queryByTestId('breadcrumb')).not.toBeInTheDocument();
  });
});
