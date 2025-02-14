// app/features/products/api/productImageService.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { ProductImage } from '../types/product.types';
import type { ImageOptimizer } from './optimization';
import { ClientImageOptimizer } from './optimization';

export class ProductImageService {
  private supabase: SupabaseClient;
  private imageOptimizer: ImageOptimizer;

  constructor(
    supabase: SupabaseClient,
    imageOptimizer: ImageOptimizer = new ClientImageOptimizer()
  ) {
    this.supabase = supabase;
    this.imageOptimizer = imageOptimizer;
  }

  async existingPrimary(productId: string): Promise<boolean> {
    // Check if there's any primary image for this product
    const { data: existingPrimary, error: primaryCheckError } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .maybeSingle();

    if (primaryCheckError) throw primaryCheckError;
    return !!existingPrimary;
  }

  async sortOrder(productId: string): Promise<number> {
    // Get next sort order with better error handling
    let sortOrder = 0;
    try {
      const { data: images, error: sortOrderError } = await this.supabase
        .from('product_images')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false });

      if (sortOrderError) {
        console.error('Error fetching sort order:', sortOrderError);
      } else if (images && images.length > 0) {
        sortOrder = images[0].sort_order + 1;
      }
    } catch (error) {
      console.error('Failed to get sort order:', error);
      // Continue with default sort order 0
    }
    return sortOrder;
  }

  async uploadToStorage(filePath: string, optimizedImage: Blob, type: string): Promise<void> {
    // Upload file with explicit content type and retries
    const { error: uploadError } = await this.supabase.storage
      .from('product-images')
      .upload(filePath, optimizedImage, {
        cacheControl: '3600',
        upsert: false,
        contentType: type || 'image/jpeg', // Fallback content type
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      if (uploadError.message?.includes('Unauthorized')) {
        throw new Error(
          'You do not have permission to upload images. Please check your login status and try again.'
        );
      }
      throw uploadError;
    }
  }

  async publicUrl(filePath: string): Promise<string> {
    // Get public URL
    const { data: urlData } = this.supabase.storage.from('product-images').getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    console.log('filePath:', filePath, 'Public URL:', urlData.publicUrl);
    return urlData?.publicUrl;
  }

  async insertRecord(productId: string, filePath: string, fileName: string) {
    // Insert the image record with better error handling
    const { data: imageRecord, error: dbError } = await this.supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: await this.publicUrl(filePath),
        storage_path: filePath,
        file_name: fileName,
        is_primary: false, // Always false initially
        sort_order: await this.sortOrder(productId),
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (dbError) {
      // Clean up the uploaded file on error
      await this.supabase.storage.from('product-images').remove([filePath]);

      if (dbError.code === 'PGRST116' || dbError.message?.includes('security policy')) {
        throw new Error(
          'You do not have permission to add images. Please ensure you are logged in with admin privileges.'
        );
      }
      throw new Error(`Failed to save image record: ${dbError.message}`);
    }

    return imageRecord;
  }

  async uploadImage(
    file: File,
    productId: string,
    isPrimary: boolean = false
  ): Promise<ProductImage> {
    console.log('Uploading image for product', productId, 'as primary:', isPrimary);
    try {
      // Only set as primary if explicitly requested or if no primary exists
      const shouldBePrimary = isPrimary || !(await this.existingPrimary(productId));

      // Optimize image using the injected optimizer
      const optimizedImage = await this.imageOptimizer.optimizeImage(file, {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 85,
      });
      console.log('Image optimized');

      const fileExt = file.name.split('.').pop();
      const fileName = `${nanoid()}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      const { data: files } = await this.supabase.storage.from('product-images').list(productId);
      console.log('Files in product folder (', productId, '): ', files);

      // Upload file with explicit content type and retries
      await this.uploadToStorage(filePath, optimizedImage, file.type);
      console.log('Image uploaded');

      // Insert the image record with better error handling
      const imageRecord = await this.insertRecord(productId, filePath, fileName);
      console.log('Image record inserted');

      // If this should be primary, set it as primary after creation
      if (shouldBePrimary && imageRecord) {
        try {
          await this.setPrimaryImage(imageRecord.id);
          // Update the local record to reflect the change
          imageRecord.is_primary = true;
          console.log('Image set as primary');
        } catch (error) {
          console.error('Error setting primary image:', error);
          // Don't throw here as the image was still uploaded successfully
        }
      }

      return imageRecord;
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof Error) {
        throw error; // Preserve the custom error message
      }
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  async imagesExist(productId: string): Promise<boolean> {
    const { data: existingImages, error: checkError } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing images:', checkError);
      // Continue as this is not critical
    }

    return existingImages != null && existingImages.length > 0;
  }

  async uploadMultipleImages(files: File[], productId: string): Promise<ProductImage[]> {
    // First, check if there are any existing images
    const isFirstUpload = !(await this.imagesExist(productId));

    // Upload sequentially to maintain order
    const uploadedImages: ProductImage[] = [];
    for (const [index, file] of files.entries()) {
      try {
        const isPrimary = isFirstUpload && index === 0; // Only first image of first upload is primary
        console.log(
          'Uploading image',
          index + 1,
          'of',
          files.length,
          'for product',
          productId,
          'as primary:',
          isPrimary
        );
        const image = await this.uploadImage(file, productId, isPrimary);
        uploadedImages.push(image);
      } catch (error) {
        console.error(`Error uploading image ${index + 1}:`, error);
        // Continue with next image instead of failing completely
      }
    }

    if (uploadedImages.length === 0) {
      throw new Error('Failed to upload any images. Please check your permissions and try again.');
    }

    if (uploadedImages.length < files.length) {
      throw new Error(
        `Only ${uploadedImages.length} out of ${files.length} images were uploaded successfully.`
      );
    }

    return uploadedImages;
  }

  async deleteImage(imageId: string): Promise<void> {
    console.log('Deleting image', imageId);
    const { data: image, error: getError } = await this.supabase
      .from('product_images')
      .select('storage_path, product_id, is_primary')
      .eq('id', imageId)
      .single();
    console.log('Image data:', image, getError);

    if (getError) {
      if (getError.code === 'PGRST116' || getError.message?.includes('security policy')) {
        throw new Error(
          'You do not have permission to delete images. Please ensure you are logged in with admin privileges.'
        );
      }
      throw getError;
    }

    // If this was primary, find a new primary image
    console.log('Image is primary:', image.is_primary);
    if (image.is_primary) {
      console.log('Image is primary, finding new primary');
      const { data: nextPrimary } = await this.supabase
        .from('product_images')
        .select('id, url')
        .eq('product_id', image.product_id)
        .neq('id', imageId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (nextPrimary) {
        await Promise.all([
          this.supabase
            .from('products')
            .update({ image_url: nextPrimary.url })
            .eq('id', image.product_id),
          this.supabase
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', nextPrimary.id),
        ]);
      } else {
        console.log('No new primary image found, setting to null');
        await this.supabase.from('products').update({ image_url: null }).eq('id', image.product_id);
      }
    }

    // Delete the image file
    const { error: storageError } = await this.supabase.storage
      .from('product-images')
      .remove([image.storage_path]);

    if (storageError) {
      console.error('Error deleting image file:', storageError);
      // Continue to delete the database record even if storage deletion fails
    }
    console.log('Image file deleted');

    // Delete the database record
    const { error: deleteError } = await this.supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      if (deleteError.code === 'PGRST116' || deleteError.message?.includes('security policy')) {
        throw new Error(
          'You do not have permission to delete images. Please ensure you are logged in with admin privileges.'
        );
      }
      throw deleteError;
    }
    console.log('Image record deleted');

    // Reorder remaining images
    await this.reorderImages(image.product_id);
  }

  async setPrimaryImage(imageId: string): Promise<void> {
    // get product id
    const { data: image, error } = await this.supabase
      .from('product_images')
      .select('product_id, url')
      .eq('id', imageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('security policy')) {
        throw new Error(
          'You do not have permission to update images. Please ensure you are logged in with admin privileges.'
        );
      }
      throw error;
    }

    if (!image) {
      throw new Error('Image not found');
    }

    await Promise.all([
      // Reset all images for this product
      this.supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', image.product_id),

      // Set new primary
      this.supabase.from('product_images').update({ is_primary: true }).eq('id', imageId),

      // Update product
      this.supabase.from('products').update({ image_url: image.url }).eq('id', image.product_id),
    ]);
  }

  async updateImageOrder(imageId: string, newOrder: number): Promise<void> {
    const { error } = await this.supabase
      .from('product_images')
      .update({ sort_order: newOrder })
      .eq('id', imageId);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('security policy')) {
        throw new Error(
          'You do not have permission to update image order. Please ensure you are logged in with admin privileges.'
        );
      }
      throw error;
    }
  }

  async reorderImages(productId: string): Promise<void> {
    console.log('Reordering images for product', productId);
    try {
      const { data: images, error } = await this.supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('security policy')) {
          throw new Error(
            'You do not have permission to reorder images. Please ensure you are logged in with admin privileges.'
          );
        }
        throw error;
      }

      if (!images) return;
      console.log('Images to reorder:', images);

      await Promise.all(
        images.map((image, index) =>
          this.supabase.from('product_images').update({ sort_order: index }).eq('id', image.id)
        )
      );
      console.log('Images reordered');
    } catch (error) {
      console.error('Error reordering images:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reorder images. Please try again.');
    }
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await this.supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching product images:', error);
      throw new Error('Failed to fetch product images. Please try again.');
    }

    return data || [];
  }
}
