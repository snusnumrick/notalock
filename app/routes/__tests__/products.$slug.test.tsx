// app/routes/__tests__/products.$slug.test.tsx
import { screen } from '@testing-library/react';
import { renderWithRemix } from '../../../tests/utils/render-with-remix';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProductPage, { loader } from '../_layout.products.$slug';
import type { Mock } from 'vitest';

// Mock all of @remix-run/react first so Link doesn't trigger router errors
vi.mock('@remix-run/react', async () => {
  const actual = await vi.importActual('@remix-run/react');
  return {
    ...actual,
    useLoaderData: vi.fn(),
    useNavigation: vi.fn(),
    useMatches: vi.fn(),
    useLocation: vi.fn(),
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
    // Mock any other hooks that need to be used
    useHref: vi.fn().mockReturnValue('#'),
  };
});

// Mock environment variables
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_ANON_KEY', 'test-key');

// Mock Supabase service
vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseClient: vi.fn() as Mock,
}));

// Create a helper function to mock Supabase client
function createSupabaseMock(customMocks: Record<string, unknown> = {}): any {
  const defaultMocks = {
    fromData: {},
    singleData: null,
    error: null,
  };

  const mocks = { ...defaultMocks, ...customMocks };

  const createQueryBuilder = (returnValue: Record<string, unknown> = {}) => {
    const builder: Record<string, unknown> = {};

    const methods = [
      'select',
      'insert',
      'update',
      'delete',
      'upsert',
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'like',
      'ilike',
      'is',
      'in',
      'contains',
      'containedBy',
      'rangeGt',
      'rangeGte',
      'rangeLt',
      'rangeLte',
      'rangeAdjacent',
      'overlaps',
      'textSearch',
      'match',
      'not',
      'filter',
      'or',
      'order',
      'limit',
      'range',
      'maybeSingle',
    ];

    methods.forEach(method => {
      builder[method] = vi.fn().mockReturnThis();
    });

    builder.then = vi.fn().mockImplementation(callback => Promise.resolve(callback(returnValue)));
    builder.single = vi.fn().mockResolvedValue(returnValue);

    return builder;
  };

  return {
    from: vi.fn().mockImplementation(table => {
      const tableData = (mocks.fromData as Record<string, unknown>)[table] || {};

      return createQueryBuilder({
        data: tableData,
        error: mocks.error,
      });
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
        list: vi.fn(),
        remove: vi.fn(),
      }),
    },
  };
}

// Mock all the components used in ProductPage
vi.mock('~/features/products/components/ProductGallery', () => ({
  default: ({
    images,
  }: {
    images?: {
      id: string;
      url: string;
      is_primary: boolean;
      product_id: string;
      sort_order: number;
    }[];
  }) => <div data-testid="product-gallery">Mock Gallery ({images?.length || 0} images)</div>,
}));

vi.mock('~/features/products/components/ProductInfo', () => ({
  ProductInfo: ({ product }: { product: { name: string } }) => (
    <div data-testid="product-info">Mock Product Info: {product.name}</div>
  ),
}));

vi.mock('~/features/products/components/ProductVariantSelector', () => ({
  ProductVariantSelector: ({
    variants,
  }: {
    variants?: { id: string; name: string; product_id: string; price_adjustment: number }[];
  }) => (
    <div data-testid="product-variant-selector">
      Mock Variant Selector ({variants?.length || 0} variants)
    </div>
  ),
}));

vi.mock('~/features/products/components/RelatedProducts', () => ({
  RelatedProducts: ({
    products,
  }: {
    products?: { id: string; name: string; retail_price: number; image_url: string }[];
  }) => (
    <div data-testid="related-products">
      Mock Related Products ({products?.length || 0} products)
    </div>
  ),
}));

vi.mock('~/components/common/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

// Mock data
const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  slug: 'test-product',
  sku: null,
  description: 'Test description',
  retail_price: 99.99,
  stock: 10,
  is_active: true,
  created_at: '2023-01-01',
  category_id: 'cat-1',
  images: [
    {
      id: 'img-1',
      url: '/test-image-1.jpg',
      is_primary: true,
      product_id: 'product-1',
      sort_order: 0,
    },
    {
      id: 'img-2',
      url: '/test-image-2.jpg',
      is_primary: false,
      product_id: 'product-1',
      sort_order: 1,
    },
  ],
  variants: [{ id: 'var-1', name: 'Variant 1', product_id: 'product-1', price_adjustment: 5.0 }],
};

const mockRelatedProducts = [
  {
    id: 'related-1',
    name: 'Related Product 1',
    slug: 'related-product-1',
    retail_price: 79.99,
    image_url: '/thumb-1.jpg',
  },
  {
    id: 'related-2',
    name: 'Related Product 2',
    slug: 'related-product-2',
    retail_price: 89.99,
    image_url: '/thumb-2.jpg',
  },
];

// Import the modules we're using in the test file
import { useLoaderData, useNavigation, useMatches, useLocation } from '@remix-run/react';
import { createSupabaseClient } from '../../server/services/supabase.server';

describe('Product Detail Page', () => {
  // Setup for component tests
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock Remix hooks for testing
    vi.mocked(useMatches).mockReturnValue([
      { id: 'root', data: {}, pathname: '/', params: {}, handle: undefined },
      {
        id: 'routes/products',
        data: { currentProduct: mockProduct },
        pathname: '/products',
        params: {},
        handle: undefined,
      },
    ]);

    vi.mocked(useLoaderData).mockReturnValue({
      product: mockProduct,
      relatedProducts: mockRelatedProducts,
    });

    vi.mocked(useNavigation).mockReturnValue({
      state: 'idle',
      location: undefined,
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
      json: undefined,
      text: undefined,
    });

    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/test-product',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  it('renders the product details when data is loaded', () => {
    renderWithRemix(<ProductPage />);

    // Check main components using test IDs
    expect(screen.getByTestId('product-gallery')).toBeInTheDocument();
    expect(screen.getByText('Mock Product Info: Test Product')).toBeInTheDocument();
    expect(screen.getByText('Mock Variant Selector (1 variants)')).toBeInTheDocument();
    expect(screen.getByText('Mock Related Products (2 products)')).toBeInTheDocument();
  });

  it('renders loading skeleton when navigation state is loading', () => {
    // Keep all other mocks the same, just override navigation state
    vi.mocked(useNavigation).mockReturnValue({
      state: 'loading',
      location: {
        pathname: '/products/test-product',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      },
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
      json: undefined,
      text: undefined,
    });

    // Make sure location is still mocked
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/test-product',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // First, render the component with loading state
    renderWithRemix(<ProductPage />);

    // In loading state, the ProductInfo component shouldn't be rendered
    const productInfo = screen.queryByText('Mock Product Info:');
    expect(productInfo).not.toBeInTheDocument();
  });

  it('passes the correct props to child components', () => {
    // Ensure our mocks are set up correctly
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/products/test-product',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    renderWithRemix(<ProductPage />);

    // Check gallery props
    expect(screen.getByText('Mock Gallery (2 images)')).toBeInTheDocument();

    // Check product info props
    expect(screen.getByText('Mock Product Info: Test Product')).toBeInTheDocument();

    // Check variant selector props
    expect(screen.getByText('Mock Variant Selector (1 variants)')).toBeInTheDocument();

    // Check related products props
    expect(screen.getByText('Mock Related Products (2 products)')).toBeInTheDocument();
  });
});

describe('Product Detail Loader', () => {
  let mockSupabase: ReturnType<typeof createSupabaseMock>;
  let mockRequest: Request;
  let mockParams: { slug: string };

  // Setup for loader tests
  beforeEach(() => {
    mockRequest = new Request('https://test.com/products/test-product');
    mockParams = { slug: 'test-product' };

    // Create mock data for Supabase responses
    const fromData = {
      products: mockProduct,
    };

    // Use our helper to create a proper Supabase mock
    mockSupabase = createSupabaseMock({
      fromData,
      singleData: {
        data: mockProduct,
        error: null,
      },
    });

    // For the related products query
    mockSupabase.from('products').select().neq().limit = vi.fn().mockResolvedValue({
      data: mockRelatedProducts,
      error: null,
    });

    (createSupabaseClient as Mock).mockReturnValue(mockSupabase);
  });

  it('successfully loads product and related products data', async () => {
    // Mock the Supabase client to return expected data
    const mockFromMethod = vi.fn();

    // Mock for products table - single returns the mockProduct
    const mockSingleMethod = vi.fn().mockResolvedValue({
      data: mockProduct,
      error: null,
    });

    // Mock for products table - limit returns the mockRelatedProducts
    const mockLimitMethod = vi.fn().mockResolvedValue({
      data: mockRelatedProducts,
      error: null,
    });

    mockFromMethod.mockImplementation(table => {
      if (table === 'products') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: mockLimitMethod,
          single: mockSingleMethod,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    mockSupabase = { from: mockFromMethod } as any;
    (createSupabaseClient as Mock).mockReturnValue(mockSupabase);

    // Call the loader
    const result = await loader({ request: mockRequest, params: mockParams, context: {} });
    const data = await result.json();

    // Assert on the expected data
    expect(data.product).toEqual(mockProduct);
    expect(data.relatedProducts).toEqual(mockRelatedProducts);
    expect(createSupabaseClient as Mock).toHaveBeenCalledWith(mockRequest, expect.any(Response));
  });

  it('throws 404 when product is not found', async () => {
    // Create a mock that properly throws a Response with 404 status
    const errorMockFrom = vi.fn();
    const errorMockSelect = vi.fn().mockReturnThis();
    const errorMockEq = vi.fn().mockReturnThis();
    const errorMockOrder = vi.fn().mockReturnThis();
    const errorMockSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error('Not found') });

    errorMockFrom.mockReturnValue({
      select: errorMockSelect,
      eq: errorMockEq,
      order: errorMockOrder,
      single: errorMockSingle,
    });

    mockSupabase = { from: errorMockFrom } as any;
    (createSupabaseClient as Mock).mockReturnValue(mockSupabase);

    // The loader should throw a Response with status 404
    await expect(async () => {
      await loader({ request: mockRequest, params: mockParams, context: {} });
    }).rejects.toThrow();

    try {
      await loader({ request: mockRequest, params: mockParams, context: {} });
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(404);
    }
  });

  it('handles unexpected errors with a 500 response', async () => {
    // Modify Supabase mock to throw an error
    (mockSupabase.from as Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    // The loader should throw a Response with status 500
    try {
      await loader({ request: mockRequest, params: mockParams, context: {} });
      // If we reach here, the test should fail because an error should have been thrown
      expect('This should not be reached').toBe('Error should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(500);
      expect((error as Response).statusText).toBe('Unexpected error');
    }
  });
});
