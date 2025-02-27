import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { getAdminImageService } from '~/features/products/api/imageServiceProvider';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    if (request.method !== 'POST') {
      throw json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { user, response } = await requireAdmin(request);
    const supabase = createSupabaseClient(request, response);

    // Get form data
    const formData = await request.formData();
    const productId = formData.get('productId');
    const isPrimary = formData.get('isPrimary') === 'true';
    const altText = formData.get('altText');
    const file = formData.get('file');

    if (!productId || typeof productId !== 'string') {
      throw json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (altText && typeof altText !== 'string') {
      throw json({ error: 'Alt text must be a string' }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      throw json({ error: 'Image file is required' }, { status: 400 });
    }

    // Create image service with server-side optimization
    const imageService = getAdminImageService(supabase);

    // Upload image using the service (which handles optimization internally)
    const uploadedImage = await imageService.uploadImage(file, productId, isPrimary);

    // Update alt text if provided
    if (altText) {
      const { error: updateError } = await supabase
        .from('product_images')
        .update({ alt_text: altText, updated_by: user.id })
        .eq('id', uploadedImage.id);

      if (updateError) {
        console.error('Failed to update alt text:', updateError);
        // Non-critical error, continue with the upload
      }
    }

    return json(uploadedImage, {
      headers: response.headers,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Upload image error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};
