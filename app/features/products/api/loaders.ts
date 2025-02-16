import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { getProducts } from './products.server';

export async function productsLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const categoryId = url.searchParams.get('category');
  const limit = 12;

  try {
    const { products, total } = await getProducts({
      page,
      limit,
      categoryId: categoryId || null,
    });

    return json({
      products,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error loading products:', error);
    throw json({ message: 'Failed to load products. Please try again later.' }, { status: 500 });
  }
}
