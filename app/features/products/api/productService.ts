import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Product, ProductFormData } from '../types/product.types';
import { ProductImageService } from './productImageService';

export class ProductService {
  private supabase: SupabaseClient;
  private currentSession: Session | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  setSession(session: Session) {
    this.currentSession = session;
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
    if (!this.currentSession) {
      const { data } = await this.supabase.auth.getSession();
      if (!data.session) {
        throw new Error('No active session found');
      }
      this.currentSession = data.session;
    }

    const productData = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      retail_price: parseFloat(formData.retail_price),
      business_price: parseFloat(formData.business_price),
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
      image_url: null,
    };

    const { data: product, error: productError } = await this.supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      throw new Error(`Failed to create product: ${productError.message}`);
    }

    if (formData.tempImages && formData.tempImages.length > 0) {
      const imageService = new ProductImageService(this.supabase);
      try {
        for (const tempImage of formData.tempImages) {
          await imageService.uploadImage(tempImage.file, product.id, tempImage.isPrimary);
        }

        const { data: productWithImages, error: fetchError } = await this.supabase
          .from('products')
          .select('*, product_images(*)')
          .eq('id', product.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        return productWithImages;
      } catch (imageError) {
        console.error('Error uploading images:', imageError);
        return product;
      }
    }

    return product;
  }

  async updateProduct(id: string, formData: ProductFormData): Promise<Product> {
    if (!this.currentSession) {
      const { data } = await this.supabase.auth.getSession();
      if (!data.session) {
        throw new Error('No active session found');
      }
      this.currentSession = data.session;
    }

    const productData = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      retail_price: parseFloat(formData.retail_price),
      business_price: parseFloat(formData.business_price),
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
      image_url: formData.image_url,
    };

    const { data, error } = await this.supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select('*, product_images(*)')
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.currentSession) {
      const { data } = await this.supabase.auth.getSession();
      if (!data.session) {
        throw new Error('No active session found');
      }
      this.currentSession = data.session;
    }

    console.log('Current session state:', this.currentSession);

    try {
      // First, check if the user has admin role
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', this.currentSession.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        throw new Error('User does not have admin permissions');
      }

      // First, delete all associated images
      const { data: images } = await this.supabase
        .from('product_images')
        .select('storage_path')
        .eq('product_id', id);

      if (images && images.length > 0) {
        const { error: storageError } = await this.supabase.storage
          .from('product-images')
          .remove(images.map(img => img.storage_path));

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
        } else {
          console.log('Deleted images from storage');
        }
      }

      // Then delete the product
      const { error: deleteError } = await this.supabase.from('products').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Verify deletion
      const { data: verifyProduct } = await this.supabase
        .from('products')
        .select('id')
        .eq('id', id)
        .single();

      if (verifyProduct) {
        throw new Error('Product deletion failed - record still exists');
      }

      console.log('Product deleted successfully');
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete product: ${error.message}`);
      }
      throw new Error('Failed to delete product: Unknown error');
    }
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  }
}
