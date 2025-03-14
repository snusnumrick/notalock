// app/components/common/__tests__/Header.test.tsx
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Header } from '../Header';
import type { CartItem } from '../../../features/cart/types/cart.types';
import { Category } from '~/features/categories/types/category.types';

// Mock dependencies
// Mock CategoryBreadcrumbs component
vi.mock('../../../features/categories/components/Breadcrumbs/CategoryBreadcrumbs', () => ({
  __esModule: true,
  default: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
  CategoryBreadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

// Mock category menu component
vi.mock('../Navigation/CategoryMenu', () => ({
  __esModule: true,
  default: () => <div data-testid="category-menu">Category Menu</div>,
}));

// Mock referringCategoryUtils
vi.mock('../../../features/categories/utils/referringCategoryUtils', () => ({
  getReferringCategory: () => null,
  clearReferringCategory: () => {},
}));

// Mock categoryUtils functions
vi.mock('../../../features/categories/utils/categoryUtils', () => ({
  findCategoryBySlug: () => null,
  getCategoryPath: () => [],
}));

// Mock categories data
vi.mock('../../../data/categories', () => ({
  categories: [],
  buildCategoryTree: () => {},
  initializeCategories: () => {},
}));

// Mock UI components
vi.mock('../../../components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  BreadcrumbItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  BreadcrumbLink: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  BreadcrumbList: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  BreadcrumbPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  BreadcrumbSeparator: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

// Mock HeaderCartIndicator
vi.mock('../HeaderCartIndicator', () => ({
  HeaderCartIndicator: () => <div data-testid="header-cart-indicator">Cart Indicator</div>,
}));

// Mock lucide-react icons
vi.mock('@heroicons/react/24/outline', () => ({
  UserIcon: () => <div data-testid="user-icon"></div>,
}));

// Mock useFetcher and location
const mockFetcherData = null;
let mockPathname = '/';
vi.mock('@remix-run/react', () => ({
  ...vi.importActual('@remix-run/react'),
  useFetcher: () => ({
    submit: vi.fn(),
    state: 'idle',
    data: mockFetcherData,
  }),
  useLocation: () => ({ pathname: mockPathname }),
  useMatches: () => [],
  Link: ({ to, children, className, 'data-testid': dataTestId }: any) => (
    <a href={to} className={className} data-testid={dataTestId}>
      {children}
    </a>
  ),
}));

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();
window.dispatchEvent = mockDispatchEvent;

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock the CartContext
let mockCartItems: CartItem[] = [];
vi.mock('../../../features/cart/context/CartContext', () => ({
  useCart: () => ({
    cartItems: mockCartItems,
    isLoading: false,
    summary: {
      totalItems: mockCartItems.reduce((total, item) => total + item.quantity, 0),
      subtotal: 0,
      total: 0,
    },
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    error: null,
    isAddingToCart: false,
    cartError: null,
    cartSuccess: false,
  }),
  CartProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Helper to create mock cart items
describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockPathname = '/';
    mockCartItems = []; // Reset cart items before each test
  });

  it('renders the cart indicator component', async () => {
    const mockCategories: Category[] = [];
    render(<Header categories={mockCategories} />);

    // Check that cart indicator is present
    const cartIndicator = screen.getByTestId('header-cart-indicator');
    expect(cartIndicator).toBeInTheDocument();
    expect(cartIndicator.textContent).toBe('Cart Indicator');
  });

  it('displays categories on product pages', async () => {
    const mockCategories: Category[] = [];
    mockPathname = '/products/test-product';

    render(<Header categories={mockCategories} />);

    // The category menu should be visible
    const categoryMenu = screen.getByTestId('category-menu');
    expect(categoryMenu).toBeInTheDocument();
  });
});
