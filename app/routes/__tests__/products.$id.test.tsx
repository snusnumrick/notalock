import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useLoaderData, useNavigation } from '@remix-run/react';
import ProductPage, { loader } from '../products.$id';

// Mock @remix-run/react hooks
vi.mock('@remix-run/react', () => ({
  useLoaderData: vi.fn(),
  useNavigation: vi.fn(() => ({ state: 'idle' })),
}));

// Mock data
const mockProduct = {
  id: 'prod_123',
  name: 'Test Door Handle',
  description: 'A high-quality door handle',
  sku: 'DH-123',
  retail_price: 99.99,
  stock: 50,
  images: [
    {
      id: 'img_1',
      url: 'https://example.com/image1.jpg',
      is_primary: true,
      sort_order: 1,
    },
  ],
};

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
};

vi.mock('~/server/middleware/supabase.server', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}));

describe('ProductPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Setup default useLoaderData response
    (useLoaderData as any).mockReturnValue({ product: mockProduct });
  });

  it('renders product details correctly', async () => {
    render(<ProductPage />);

    // Check all product details are rendered
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(`SKU: ${mockProduct.sku}`)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.retail_price.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProduct.stock} available`)).toBeInTheDocument();
  });

  it('shows loading state during navigation', () => {
    // Mock navigation state as loading
    (useNavigation as any).mockReturnValue({ state: 'loading' });

    render(<ProductPage />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('successfully loads product data in loader', async () => {
    const request = new Request('http://test.com/products/123');
    const params = { id: '123' };
    const response = await loader({ request, params, context: {} });

    const data = await response.json();
    expect(data.product).toEqual(mockProduct);
  });

  it('handles product not found error', async () => {
    // Mock product not found
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: null,
      error: new Error('Product not found'),
    });

    const request = new Request('http://test.com/products/invalid');
    const params = { id: 'invalid' };

    let thrownError: Response | undefined;

    try {
      await loader({ request, params, context: {} });
    } catch (error) {
      thrownError = error as Response;
    }

    // Checking if the error was thrown and is the expected type
    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Response);
    expect(thrownError?.status).toBe(404);
    expect(await thrownError?.text()).toBe('Product not found');
  });
});
