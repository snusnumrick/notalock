import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useLoaderData, useNavigation } from '@remix-run/react';
import ProductPage, { loader } from '../products.$id';
import * as supabaseServer from '~/server/services/supabase.server';

// Mock @remix-run/react hooks
vi.mock('@remix-run/react', () => ({
  useLoaderData: vi.fn(),
  useNavigation: vi.fn(() => ({ state: 'idle' })),
}));

// Mock environment variables
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_ANON_KEY', 'test-key');

// Mock Supabase service
vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseClient: vi.fn(() => ({
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => ({
        data: {
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
        },
        error: null,
      })),
    })),
  })),
}));

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

describe('ProductPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useLoaderData as any).mockReturnValue({ product: mockProduct });
  });

  it('renders product details correctly', async () => {
    render(<ProductPage />);

    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(`SKU: ${mockProduct.sku}`)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.retail_price.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProduct.stock} available`)).toBeInTheDocument();
  });

  it('shows loading state during navigation', () => {
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
    vi.spyOn(supabaseServer, 'createSupabaseClient').mockImplementationOnce(() => ({
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    }));

    const request = new Request('http://test.com/products/invalid');
    const params = { id: 'invalid' };

    let thrownError: Response | undefined;

    try {
      await loader({ request, params, context: {} });
    } catch (error) {
      thrownError = error as Response;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Response);
    expect(thrownError?.status).toBe(404);
    expect(await thrownError?.text()).toBe('Product not found');
  });
});
