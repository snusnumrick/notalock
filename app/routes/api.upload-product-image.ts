import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireAdmin, processImage, type ImageProcessingOptions } from '~/server/middleware';
import { createSupabaseClient } from '~/server/services/supabase.server';

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

    if (!productId || typeof productId !== 'string') {
      throw json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (altText && typeof altText !== 'string') {
      throw json({ error: 'Alt text must be a string' }, { status: 400 });
    }

    // Process the image with optimization
    const options: ImageProcessingOptions = {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 85,
      format: 'webp',
    };

    const { buffer, contentType } = await processImage(request, options);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${productId}-${timestamp}.webp`;
    const storagePath = `products/${filename}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw json({ error: 'Failed to upload image to storage' }, { status: 500 });
    }

    try {
      // If this is set as primary, unset any existing primary images
      if (isPrimary) {
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);

        if (updateError) {
          console.error('Failed to update existing primary images:', updateError);
          // Continue with insert as this is not critical
        }
      }

      // Create database record
      const { data: image, error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          storage_path: storagePath,
          alt_text: altText,
          is_primary: isPrimary,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        // Cleanup uploaded file if database insert fails
        await supabase.storage.from('product-images').remove([storagePath]);
        throw json({ error: 'Failed to create image record' }, { status: 500 });
      }

      return json(image, {
        headers: response.headers,
      });
    } catch (error) {
      // Cleanup uploaded file on any database operation failure
      await supabase.storage.from('product-images').remove([storagePath]);
      throw error;
    }
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
