// app/features/products/api/productImageService.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { ProductImage } from '../types/product.types';

export class ProductImageService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // app/features/products/api/productImageService.ts

  // Update the uploadImage method to accept isPrimary parameter:
  async uploadImage(
    file: File,
    productId: string,
    isPrimary: boolean = false
  ): Promise<ProductImage> {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${nanoid()}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from('product-images').getPublicUrl(filePath);

    // Get current image count for sort order
    const { data: existingImages } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId);

    const sortOrder = existingImages?.length || 0;

    // If this image is to be primary, first remove primary status from other images
    if (isPrimary) {
      await this.supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }

    // Create database record
    const { data, error: dbError } = await this.supabase
      .from('product_images')
      .insert([
        {
          product_id: productId,
          url: publicUrl,
          storage_path: filePath,
          file_name: fileName,
          is_primary: isPrimary,
          sort_order: sortOrder,
        },
      ])
      .select()
      .single();

    if (dbError) {
      // Try to clean up the uploaded file
      await this.supabase.storage.from('product-images').remove([filePath]);

      throw new Error(`Failed to create image record: ${dbError.message}`);
    }

    return data;
  }

  async deleteImage(imageId: string): Promise<void> {
    // Get image data first
    const { data: image, error: getError } = await this.supabase
      .from('product_images')
      .select('storage_path, product_id')
      .eq('id', imageId)
      .single();

    if (getError) {
      throw new Error(`Failed to get image data: ${getError.message}`);
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
      .select('product_id')
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
