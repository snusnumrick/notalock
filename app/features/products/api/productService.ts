import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product, ProductFormData } from '../types/product.types';
import { ProductImageService } from './productImageService';

export class ProductService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async fetchProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, product_images (*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data;
  }

  async createProduct(formData: ProductFormData): Promise<Product> {
    // Debug log for auth state
    const authState = await this.supabase.auth.getUser();
    const sessionState = await this.supabase.auth.getSession();
    console.log('Auth Debug:', {
      user: authState.data.user,
      session: sessionState.data.session,
      supabaseClient: !!this.supabase,
    });

    // Get the current session to ensure we have auth
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session - please login again');
    }

    const productData = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      retail_price: parseFloat(formData.retail_price),
      business_price: parseFloat(formData.business_price),
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
    };

    // First create the product
    const { data: product, error: productError } = await this.supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      throw new Error(`Failed to create product: ${productError.message}`);
    }

    // If there are temporary images, upload them
    if (formData.tempImages && formData.tempImages.length > 0) {
      const imageService = new ProductImageService(this.supabase);

      try {
        // Upload each image
        for (const tempImage of formData.tempImages) {
          await imageService.uploadImage(tempImage.file, product.id, tempImage.isPrimary);
        }

        // Fetch the product again with its images
        const { data: productWithImages, error: fetchError } = await this.supabase
          .from('products')
          .select(
            `
            *,
            images:product_images(*)
          `
          )
          .eq('id', product.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        return productWithImages;
      } catch (imageError) {
        console.error('Error uploading images:', imageError);
        // If image upload fails, still return the product but log the error
        return product;
      }
    }

    return product;
  }

  async updateProduct(id: string, formData: ProductFormData): Promise<Product> {
    const productData = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      retail_price: parseFloat(formData.retail_price),
      business_price: parseFloat(formData.business_price),
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
    };

    const { data, error } = await this.supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select(
        `
        *,
        images:product_images(*)
      `
      )
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      // First, delete all associated images
      const { data: images } = await this.supabase
        .from('product_images')
        .select('storage_path')
        .eq('product_id', id);

      if (images && images.length > 0) {
        // Delete files from storage
        const { error: storageError } = await this.supabase.storage
          .from('product-images')
          .remove(images.map(img => img.storage_path));

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
        }
      }

      // Then delete the product (cascade will handle the product_images records)
      const { error } = await this.supabase.from('products').delete().eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error(
        `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .select(
        `
        *,
        images:product_images(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  }
}
