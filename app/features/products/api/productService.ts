import { SupabaseClient } from '@supabase/supabase-js';
import { Product, ProductFormData } from '../types/product.types';

export class ProductService {
    constructor(private supabase: SupabaseClient) {}

    async fetchProducts(): Promise<Product[]> {
        const { data, error } = await this.supabase
            .from('products')
            .select('*, product_images (*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createProduct(formData: ProductFormData): Promise<Product> {
        // Insert product
        const { data: productData, error: productError } = await this.supabase
            .from('products')
            .insert({
                name: formData.name,
                sku: formData.sku,
                description: formData.description,
                retail_price: parseFloat(formData.retail_price),
                business_price: parseFloat(formData.business_price),
                stock: parseInt(formData.stock),
                is_active: formData.is_active
            })
            .select()
            .single();

        if (productError) throw productError;

        // Upload images if provided
        if (formData.files && formData.files.length > 0) {
            await this.uploadProductImages(productData.id, formData.files);
        }

        // Fetch and return the complete product with images
        const { data: completeProduct, error: fetchError } = await this.supabase
            .from('products')
            .select('*, product_images (*)')
            .eq('id', productData.id)
            .single();

        if (fetchError) throw fetchError;
        return completeProduct;
    }

    async updateProduct(id: number, formData: ProductFormData): Promise<Product> {
        const { data: updatedProduct, error: updateError } = await this.supabase
            .from('products')
            .update({
                name: formData.name,
                sku: formData.sku,
                description: formData.description,
                retail_price: parseFloat(formData.retail_price),
                business_price: parseFloat(formData.business_price),
                stock: parseInt(formData.stock),
                is_active: formData.is_active
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        if (formData.files && formData.files.length > 0) {
            await this.uploadProductImages(id, formData.files);
        }

        const { data: completeProduct, error: fetchError } = await this.supabase
            .from('products')
            .select('*, product_images (*)')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        return completeProduct;
    }

    async deleteProduct(id: number): Promise<void> {
        // Delete product images from storage first
        const { data: images } = await this.supabase
            .from('product_images')
            .select('url')
            .eq('product_id', id);

        if (images) {
            for (const image of images) {
                await this.supabase.storage
                    .from('product-images')
                    .remove([image.url]);
            }
        }

        // Delete the product (this will cascade delete the product_images records)
        const { error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    private async uploadProductImages(productId: number, files: FileList): Promise<void> {
        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${productId}/${Date.now()}.${fileExt}`;

            // Upload file to storage
            const { error: uploadError } = await this.supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Create image record
            const { error: imageError } = await this.supabase
                .from('product_images')
                .insert({
                    product_id: productId,
                    url: fileName,
                    is_primary: false
                });

            if (imageError) throw imageError;
        }
    }
}