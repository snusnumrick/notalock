import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { getAdminImageService } from '~/features/products/api/imageServiceProvider';

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

    // Get the form data and extract the file
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw json({ error: 'Image file is required' }, { status: 400 });
    }

    // Get existing image details
    const { data: image, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      throw json({ error: 'Image not found' }, { status: 404 });
    }

    // Create image service with server-side optimization
    const imageService = getAdminImageService(supabase);

    // Get an optimized version of the image
    const originalFile = file;
    const optimizedBlob = await imageService.optimizeImage(originalFile);

    // Convert blob to file for upload
    const arrayBuffer = await optimizedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Update the storage with the optimized image
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .update(image.storage_path, buffer, {
        contentType: optimizedBlob.type,
        upsert: true,
      });

    if (storageError) {
      throw json({ error: 'Failed to update image in storage' }, { status: 500 });
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
