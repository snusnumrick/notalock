import { vi } from 'vitest';
import React from 'react';

/**
 * Creates a complete mock for @remix-run/react components and hooks
 * Based on the testing guidelines in docs/development/testing.md
 */
export const createRemixStub = () => {
  return {
    // Core data hooks
    useLoaderData: vi.fn(),
    useActionData: vi.fn(),
    useNavigation: vi.fn().mockReturnValue({ state: 'idle' }),
    useRouteError: vi.fn(),
    useLocation: vi.fn().mockReturnValue({ pathname: '/products/test-product', search: '' }),

    // Fetcher API
    useFetcher: vi.fn().mockReturnValue({
      Form: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
      submit: vi.fn(),
      load: vi.fn(),
      state: 'idle',
      type: 'done',
      data: undefined,
    }),

    // Navigation hooks
    useNavigate: vi.fn(),
    useSubmit: vi.fn(),
    useMatches: vi.fn().mockReturnValue([
      { id: 'root', data: {} },
      { id: 'routes/products', data: {} },
    ]),
    useParams: vi.fn().mockReturnValue({}),

    // UI Components
    Link: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className} data-testid="link">
        {children}
      </a>
    ),
    Form: ({
      children,
      method,
      action,
    }: {
      children: React.ReactNode;
      method?: string;
      action?: string;
    }) => (
      <form method={method} action={action}>
        {children}
      </form>
    ),
    Outlet: () => <div data-testid="outlet-content">Outlet Content</div>,
    Links: () => <div>Links</div>,
    Meta: () => <div>Meta</div>,
    Scripts: () => <div>Scripts</div>,
    ScrollRestoration: () => <div>ScrollRestoration</div>,
    LiveReload: () => <div>LiveReload</div>,

    // Utilities
    isRouteErrorResponse: vi.fn().mockReturnValue(false),
    json: (data: unknown) => data,
  };
};

/**
 * Creates mock React Router context providers needed for Remix hooks
 * Based on testing guidelines from docs/development/testing.md
 */

// Create context objects
const DataRouterContext = React.createContext<typeof dataRouterContext | null>(null);
const DataRouterStateContext = React.createContext<typeof dataRouterStateContext | null>(null);

// Router context with navigation methods
const dataRouterContext = {
  router: {
    navigate: vi.fn(),
    fetch: vi.fn(),
    revalidate: vi.fn(),
    encodeLocation: vi.fn(),
    basename: '',
    future: {},
    history: { push: vi.fn(), replace: vi.fn(), go: vi.fn(), back: vi.fn(), forward: vi.fn() },
    static: false,
    createHref: vi.fn(),
  },
  fetcher: {
    Form: vi.fn(),
    submit: vi.fn(),
    load: vi.fn(),
  },
};

// Router state context with navigation and data
const dataRouterStateContext = {
  location: {
    pathname: '/products/test-product',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  },
  loaderData: {},
  actionData: null,
  errors: {},
  matches: [
    { id: 'root', data: {} },
    {
      id: 'routes/products',
      data: { currentProduct: { name: 'Test Product', slug: 'test-product' } },
    },
  ],
  fetchers: new Map(),
  navigation: { state: 'idle' },
};

/**
 * Provider component that wraps children with necessary Remix router contexts
 * This allows Remix hooks like useFetcher to work properly in tests
 */
export const RemixMockProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <DataRouterContext.Provider value={dataRouterContext}>
      <DataRouterStateContext.Provider value={dataRouterStateContext}>
        <div data-testid="data-router-context">{children}</div>
      </DataRouterStateContext.Provider>
    </DataRouterContext.Provider>
  );
};
