// app/routes/api.update-product-image.$imageId.ts
import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseServerClient } from '~/server/services/supabase.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== 'PATCH') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const imageId = params.imageId;
  if (!imageId) {
    return json({ error: 'Image ID is required' }, { status: 400 });
  }

  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  // Check if user is authenticated and is admin
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const isPrimary = formData.get('is_primary') === 'true';

    // Get the current image to find its product_id
    const { data: currentImage } = await supabase
      .from('product_images')
      .select('product_id')
      .eq('id', imageId)
      .single();

    if (!currentImage) {
      return json({ error: 'Image not found' }, { status: 404 });
    }

    // If setting as primary, first remove primary status from all other images
    if (isPrimary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', currentImage.product_id);
    }

    // Update the target image
    const { data: updatedImage, error: updateError } = await supabase
      .from('product_images')
      .update({ is_primary: isPrimary })
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      return json({ error: 'Failed to update image' }, { status: 500 });
    }

    return json(updatedImage);
  } catch (error) {
    console.error('Update error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
