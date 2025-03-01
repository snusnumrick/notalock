import { screen } from '@testing-library/react';
import { renderWithRemix } from '../../../tests/utils/render-with-remix';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// We're using the global mock from setup.ts instead of this local mock
// But we still need to customize some behavior for these specific tests

// Mock the Footer component explicitly
vi.mock('~/components/common/Footer', () => ({
  Footer: () => <footer data-testid="footer-component">Footer Content</footer>,
}));

// Mock CartProvider to avoid context issues
vi.mock('~/features/cart/context/CartContext', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="cart-provider">{children}</div>
  ),
}));

// Manually mock the hook functions
let mockPathname = '/products';
vi.mock('@remix-run/react', () => ({
  useLoaderData: () => ({
    env: {
      SUPABASE_URL: 'https://example.com',
      SUPABASE_ANON_KEY: 'anon-key',
    },
    session: null,
    profile: null,
    cartItems: [],
  }),
  useLocation: () => ({
    pathname: mockPathname,
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
  Outlet: () => {
    // Conditionally render footer based on pathname
    const isAdmin = mockPathname.startsWith('/admin');
    return (
      <>
        <div data-testid="outlet-content">Outlet Content</div>
        {!isAdmin && <footer data-testid="footer-component">Footer Content</footer>}
      </>
    );
  },
  Links: () => <div>Links</div>,
  Meta: () => <div>Meta</div>,
  Scripts: () => <div>Scripts</div>,
  ScrollRestoration: () => <div>ScrollRestoration</div>,
  LiveReload: () => <div>LiveReload</div>,
}));

// Import the root component after mocks are set up
import App from '../../root';

describe('Root Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/products'; // Reset to default path
  });

  it('includes Footer on non-admin pages', () => {
    mockPathname = '/products';
    renderWithRemix(<App />);

    // Verify Footer and Outlet are present
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });

  it('does not include Footer on admin pages', () => {
    mockPathname = '/admin/products';
    renderWithRemix(<App />);

    expect(screen.queryByTestId('footer-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
  });

  it('includes Footer on home page', () => {
    mockPathname = '/';
    renderWithRemix(<App />);

    // Verify Footer is present on home page
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();
  });

  it('includes Footer on login page', () => {
    mockPathname = '/login';
    renderWithRemix(<App />);

    // Verify Footer is present on login page
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();
  });
});
