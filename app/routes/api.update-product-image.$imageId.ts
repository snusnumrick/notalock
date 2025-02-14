import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  requireAdmin,
  createSupabaseClient,
  processImage,
  type ImageProcessingOptions,
} from '~/server/middleware';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  console.log('Update image');
  try {
    if (!['PUT', 'PATCH'].includes(request.method)) {
      throw json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { user, response } = await requireAdmin(request);
    const supabase = createSupabaseClient(request, response);
    const imageId = params.imageId;

    if (!imageId) {
      throw json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Process the image with optimization
    const options: ImageProcessingOptions = {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 85,
      format: 'webp',
    };

    const { buffer, contentType } = await processImage(request, options);

    // Get existing image details
    const { data: image, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      throw json({ error: 'Image not found' }, { status: 404 });
    }

    // Upload new image
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .update(image.storage_path, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Update database record
    const { data: updated, error: updateError } = await supabase
      .from('product_images')
      .update({
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      throw json({ error: 'Failed to update image record' }, { status: 500 });
    }

    return json(updated, {
      headers: response.headers,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Update image error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};
