import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { createSupabaseClient } from '~/server/services/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  console.log('Creating product...');
  const { response } = await requireAdmin(request);
  const supabase = createSupabaseClient(request, response);

  if (request.method !== 'POST') {
    return json(
      { error: 'Method not allowed' },
      {
        status: 405,
        headers: response.headers,
      }
    );
  }

  try {
    const formData = await request.json();
    const productData = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      retail_price: parseFloat(formData.retail_price),
      business_price: parseFloat(formData.business_price),
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
    };

    const { data, error } = await supabase.from('products').insert([productData]).select().single();

    if (error) throw error;

    return json(
      { product: data },
      {
        headers: response.headers,
      }
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      {
        status: 400,
        headers: response.headers,
      }
    );
  }
}
