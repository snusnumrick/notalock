// app/features/products/api/productImageService.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { ProductImage } from '../types/product.types';

export class ProductImageService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async uploadImage(
    file: File,
    productId: string,
    isPrimary: boolean = false
  ): Promise<ProductImage> {
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${nanoid()}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Upload to storage
      const { error: uploadError } = await this.supabase.storage
        .from('product-images')
        .upload(filePath, new Uint8Array(arrayBuffer), {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage.from('product-images').getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Get current image count for sort order
      const { data: existingImages, error: countError } = await this.supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId);

      if (countError) {
        throw new Error(`Failed to get existing images: ${countError.message}`);
      }

      const sortOrder = existingImages?.length || 0;
      const isFirstImage = sortOrder === 0;
      isPrimary = isPrimary || isFirstImage; // Make first image primary if none exists

      // If this image is primary, update product's image_url
      if (isPrimary) {
        const { error: productUpdateError } = await this.supabase
          .from('products')
          .update({ image_url: urlData.publicUrl })
          .eq('id', productId);

        if (productUpdateError) {
          console.error('Error updating product image_url:', productUpdateError);
        }

        // Remove primary status from other images
        const { error: updateError } = await this.supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);

        if (updateError) {
          throw new Error(`Failed to update primary status: ${updateError.message}`);
        }
      }

      // Create database record
      const insertData = {
        product_id: productId,
        url: urlData.publicUrl,
        storage_path: filePath,
        file_name: fileName,
        is_primary: isPrimary,
        sort_order: sortOrder,
      };

      const { data: insertedData, error: dbError } = await this.supabase
        .from('product_images')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        // Try to clean up the uploaded file
        await this.supabase.storage.from('product-images').remove([filePath]);
        throw new Error(`Failed to create image record: ${dbError.message}`);
      }

      return insertedData;
    } catch (error) {
      console.error('Upload process error:', error);
      throw error;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    // Get image data first
    const { data: image, error: getError } = await this.supabase
      .from('product_images')
      .select('storage_path, product_id, is_primary, url')
      .eq('id', imageId)
      .single();

    if (getError) {
      throw new Error(`Failed to get image data: ${getError.message}`);
    }

    // If this was the primary image, update product's image_url
    if (image.is_primary) {
      // Find another image to make primary
      const { data: otherImage } = await this.supabase
        .from('product_images')
        .select('id, url')
        .eq('product_id', image.product_id)
        .neq('id', imageId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (otherImage) {
        // Update product image_url and make the other image primary
        await this.supabase
          .from('products')
          .update({ image_url: otherImage.url })
          .eq('id', image.product_id);

        await this.supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', otherImage.id);
      } else {
        // No other images, clear product image_url
        await this.supabase.from('products').update({ image_url: null }).eq('id', image.product_id);
      }
    }

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from('product-images')
      .remove([image.storage_path]);

    if (storageError) {
      throw new Error(`Failed to delete image file: ${storageError.message}`);
    }

    // Delete from database
    const { error: dbError } = await this.supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      throw new Error(`Failed to delete image record: ${dbError.message}`);
    }

    // Update sort orders for remaining images
    await this.reorderImages(image.product_id);
  }

  async setPrimaryImage(imageId: string): Promise<void> {
    // Get image data first
    const { data: image, error: getError } = await this.supabase
      .from('product_images')
      .select('product_id, url')
      .eq('id', imageId)
      .single();

    if (getError) {
      throw new Error(`Failed to get image data: ${getError.message}`);
    }

    // Remove primary status from all images of this product
    const { error: updateError1 } = await this.supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', image.product_id);

    if (updateError1) {
      throw new Error(`Failed to update primary status: ${updateError1.message}`);
    }

    // Set the selected image as primary
    const { error: updateError2 } = await this.supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (updateError2) {
      throw new Error(`Failed to set primary image: ${updateError2.message}`);
    }

    // Update product's image_url
    const { error: productUpdateError } = await this.supabase
      .from('products')
      .update({ image_url: image.url })
      .eq('id', image.product_id);

    if (productUpdateError) {
      throw new Error(`Failed to update product image URL: ${productUpdateError.message}`);
    }
  }

  async reorderImages(productId: string): Promise<void> {
    // Get all images for this product
    const { data: images, error: getError } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (getError) {
      throw new Error(`Failed to get images: ${getError.message}`);
    }

    // Update sort orders
    for (let i = 0; i < images.length; i++) {
      const { error: updateError } = await this.supabase
        .from('product_images')
        .update({ sort_order: i })
        .eq('id', images[i].id);

      if (updateError) {
        throw new Error(`Failed to update sort order: ${updateError.message}`);
      }
    }
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await this.supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get product images: ${error.message}`);
    }

    return data;
  }
}
