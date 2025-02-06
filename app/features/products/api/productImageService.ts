// app/features/products/api/productImageService.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { ProductImage } from '../types/product.types';

export class ProductImageService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  private async optimizeImage(file: File): Promise<Blob> {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const MAX_WIDTH = 2000;
          const MAX_HEIGHT = 2000;

          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            blob => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image to blob'));
              }
            },
            file.type,
            0.85
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      const reader = new FileReader();
      reader.onload = e => (img.src = e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async uploadImage(
    file: File,
    productId: string,
    isPrimary: boolean = false
  ): Promise<ProductImage> {
    console.log('Uploading image for product', productId, 'as primary:', isPrimary);
    try {
      // Check if there's any primary image for this product
      const { data: existingPrimary, error: primaryCheckError } = await this.supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();

      if (primaryCheckError) throw primaryCheckError;

      // Only set as primary if explicitly requested or if no primary exists
      const shouldBePrimary = isPrimary || !existingPrimary;

      // Get next sort order
      const { data: lastImage } = await this.supabase
        .from('product_images')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const sortOrder = (lastImage?.sort_order ?? -1) + 1;

      // Optimize and upload image
      const optimizedImage = await this.optimizeImage(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `${nanoid()}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('product-images')
        .upload(filePath, optimizedImage, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = this.supabase.storage.from('product-images').getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      // Insert the image record first with is_primary false
      const { data: imageRecord, error: dbError } = await this.supabase
        .from('product_images')
        .insert({
          product_id: productId,
          url: urlData.publicUrl,
          storage_path: filePath,
          file_name: fileName,
          is_primary: false, // Always false initially
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (dbError) {
        // Clean up the uploaded file on error
        await this.supabase.storage.from('product-images').remove([filePath]);
        throw dbError;
      }

      // If this should be primary, set it as primary after creation
      if (shouldBePrimary) {
        // First set the selected image as primary
        const { error: updateError } = await this.supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', imageRecord.id);

        if (updateError) throw updateError;

        // Then remove primary status from all other images
        const { error: resetError } = await this.supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId)
          .neq('id', imageRecord.id);

        if (resetError) throw resetError;

        // Update the product's primary image URL
        const { error: productUpdateError } = await this.supabase
          .from('products')
          .update({ image_url: urlData.publicUrl })
          .eq('id', productId);

        if (productUpdateError) throw productUpdateError;

        // Update the local record to reflect the change
        imageRecord.is_primary = true;
      }

      return imageRecord;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadMultipleImages(files: File[], productId: string): Promise<ProductImage[]> {
    try {
      // First, check if there are any existing images at all
      const { data: existingImages } = await this.supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      const isFirstUpload = !existingImages || existingImages.length === 0;

      // Upload sequentially to maintain order
      const uploadedImages: ProductImage[] = [];
      for (const [index, file] of files.entries()) {
        const isPrimary = isFirstUpload && index === 0; // Only first image of first upload is primary
        console.log(
          'Uploading image',
          index,
          'of',
          files.length,
          'for product',
          productId,
          'as primary:',
          isPrimary
        );
        const image = await this.uploadImage(file, productId, isPrimary);
        uploadedImages.push(image);
      }

      return uploadedImages;
    } catch (error) {
      console.error('Multiple upload error:', error);
      throw error;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const { data: image, error: getError } = await this.supabase
      .from('product_images')
      .select('storage_path, product_id, is_primary')
      .eq('id', imageId)
      .single();

    if (getError) throw getError;

    // If this was primary, find a new primary image
    if (image.is_primary) {
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
        await this.supabase.from('products').update({ image_url: null }).eq('id', image.product_id);
      }
    }

    // Delete the image file
    await this.supabase.storage.from('product-images').remove([image.storage_path]);

    // Delete the database record
    await this.supabase.from('product_images').delete().eq('id', imageId);

    // Reorder remaining images
    await this.reorderImages(image.product_id);
  }

  async setPrimaryImage(imageId: string): Promise<void> {
    const { data: image } = await this.supabase
      .from('product_images')
      .select('product_id, url')
      .eq('id', imageId)
      .single();

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
    await this.supabase.from('product_images').update({ sort_order: newOrder }).eq('id', imageId);
  }

  async reorderImages(productId: string): Promise<void> {
    const { data: images } = await this.supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (!images) return;

    await Promise.all(
      images.map((image, index) =>
        this.supabase.from('product_images').update({ sort_order: index }).eq('id', image.id)
      )
    );
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await this.supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
