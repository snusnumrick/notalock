import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Product, ProductFormData } from '../types/product.types';
import type { FilterOptions } from '../components/ProductSearch';
import { ProductImageService } from './productImageService';

export class ProductService {
  private async updateProductCategories(productId: string, categoryIds: string[]) {
    // First, remove existing category associations
    const { error: deleteError } = await this.supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      throw new Error(`Failed to update product categories: ${deleteError.message}`);
    }

    // Then add new category associations
    if (categoryIds.length > 0) {
      const categoryAssignments = categoryIds.map(categoryId => ({
        product_id: productId,
        category_id: categoryId,
      }));

      const { error: insertError } = await this.supabase
        .from('product_categories')
        .insert(categoryAssignments);

      if (insertError) {
        throw new Error(`Failed to assign product categories: ${insertError.message}`);
      }
    }
  }
  constructor(private supabase: SupabaseClient) {}

  setSession(session: Session) {
    this.currentSession = session;
  }

  private currentSession: Session | null = null;

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
      // Categories are now handled through the junction table
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

    // Handle category assignments
    if (formData.category_ids && formData.category_ids.length > 0) {
      await this.updateProductCategories(product.id, formData.category_ids);
    }

    // Handle image uploads
    if (formData.tempImages && formData.tempImages.length > 0) {
      const imageService = new ProductImageService(this.supabase);
      try {
        for (const tempImage of formData.tempImages) {
          await imageService.uploadImage(tempImage.file, product.id, tempImage.isPrimary);
        }

        const { data: productWithImages, error: fetchError } = await this.supabase
          .from('products')
          .select(
            `
        *,
        product_images(*),
        categories:product_categories!left(category:categories(id, name))
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
      // Categories are now handled through the junction table
      image_url: formData.image_url,
    };

    // Update product data
    const { data, error } = await this.supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select(
        `
        *,
        product_images(*),
        categories:product_categories!left(category:categories(id, name))
      `
      )
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    // Update categories if provided
    if (formData.category_ids) {
      await this.updateProductCategories(id, formData.category_ids);
    }

    return data;
  }

  async fetchProducts(filters?: FilterOptions): Promise<Product[]> {
    let query = this.supabase.from('products').select(`
        *,
        product_images (*),
        variants:product_variants (*),
        categories:product_categories!left(category:categories(id, name))
      `);

    // Apply filters
    if (filters) {
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('retail_price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('retail_price', filters.maxPrice);
      }

      if (filters.minStock !== undefined) {
        query = query.gte('stock', filters.minStock);
      }

      if (filters.maxStock !== undefined) {
        query = query.lte('stock', filters.maxStock);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.hasVariants !== undefined) {
        if (filters.hasVariants) {
          query = query.not('variants', 'is', null);
        } else {
          query = query.is('variants', null);
        }
      }

      // Apply sorting
      if (filters.sortBy) {
        const sortField = filters.sortBy === 'created' ? 'created_at' : filters.sortBy;
        query = query.order(sortField, {
          ascending: filters.sortOrder === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
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

      // Delete all associated images
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
        }
      }

      // Delete variants (will cascade delete variant options)
      const { error: variantError } = await this.supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id);

      if (variantError) {
        console.error('Error deleting variants:', variantError);
      }

      // Delete the product (will cascade delete images)
      const { error: deleteError } = await this.supabase.from('products').delete().eq('id', id);

      if (deleteError) {
        throw deleteError;
      }
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
      .select(
        `
        *,
        product_images(*),
        variants:product_variants(
          *,
          options:product_variant_options(
            *,
            option_value:product_option_values(*)
          )
        )
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

  async bulkDeleteProducts(ids: string[]): Promise<void> {
    if (!this.currentSession) {
      const { data } = await this.supabase.auth.getSession();
      if (!data.session) {
        throw new Error('No active session found');
      }
      this.currentSession = data.session;
    }

    try {
      // Check admin role
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', this.currentSession.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        throw new Error('User does not have admin permissions');
      }

      // Delete associated images from storage
      const { data: images } = await this.supabase
        .from('product_images')
        .select('storage_path')
        .in('product_id', ids);

      if (images && images.length > 0) {
        const { error: storageError } = await this.supabase.storage
          .from('product-images')
          .remove(images.map(img => img.storage_path));

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
        }
      }

      // Delete variants (will cascade delete variant options)
      const { error: variantError } = await this.supabase
        .from('product_variants')
        .delete()
        .in('product_id', ids);

      if (variantError) {
        console.error('Error deleting variants:', variantError);
      }

      // Delete products (will cascade delete images)
      const { error: deleteError } = await this.supabase.from('products').delete().in('id', ids);

      if (deleteError) {
        throw deleteError;
      }
    } catch (error) {
      console.error('Error in bulkDeleteProducts:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to delete products: ${error.message}`);
      }
      throw new Error('Failed to delete products: Unknown error');
    }
  }

  async bulkUpdateProducts(
    ids: string[],
    updates: Partial<{
      is_active: boolean;
      retail_price_adjustment: number;
      business_price_adjustment: number;
      stock_adjustment: number;
    }>
  ): Promise<void> {
    if (!this.currentSession) {
      const { data } = await this.supabase.auth.getSession();
      if (!data.session) {
        throw new Error('No active session found');
      }
      this.currentSession = data.session;
    }

    try {
      // Check admin role
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', this.currentSession.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        throw new Error('User does not have admin permissions');
      }

      // Handle different types of updates
      if (updates.is_active !== undefined) {
        const { error } = await this.supabase
          .from('products')
          .update({ is_active: updates.is_active })
          .in('id', ids);

        if (error) throw error;
      }

      if (updates.retail_price_adjustment) {
        const { error } = await this.supabase.rpc('adjust_retail_prices', {
          product_ids: ids,
          adjustment: updates.retail_price_adjustment,
        });

        if (error) throw error;
      }

      if (updates.business_price_adjustment) {
        const { error } = await this.supabase.rpc('adjust_business_prices', {
          product_ids: ids,
          adjustment: updates.business_price_adjustment,
        });

        if (error) throw error;
      }

      if (updates.stock_adjustment) {
        const { error } = await this.supabase.rpc('adjust_stock', {
          product_ids: ids,
          adjustment: updates.stock_adjustment,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error in bulkUpdateProducts:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update products: ${error.message}`);
      }
      throw new Error('Failed to update products: Unknown error');
    }
  }
}
