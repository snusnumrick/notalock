import React from 'react';
import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit, useActionData } from '@remix-run/react';
import { createServerClient } from '@supabase/ssr';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReorderableImageGallery from '~/features/products/components/ReorderableImageGallery';
import ProductGallery from '~/features/products/components/ProductGallery';
import type { ProductImage } from '~/features/products/types/product.types';
import { ProductImageService } from '~/features/products/api/productImageService';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '~/server/middleware';

// Create an adapter that extends the ProductImageService class
class FormSubmitImageService extends ProductImageService {
  private submit: ReturnType<typeof useSubmit>;
  private productId: string;
  private setResults: React.Dispatch<React.SetStateAction<{ [key: string]: ProductImage }>>;
  private uploadQueue: File[] = [];
  private isUploading = false;
  private tempIdCounter = 0;

  constructor(
    submit: ReturnType<typeof useSubmit>,
    productId: string,
    _: null,
    setResults: React.Dispatch<React.SetStateAction<{ [key: string]: ProductImage }>>
  ) {
    console.log('Creating FormSubmitImageService with productId:', productId);
    super({} as SupabaseClient);
    this.submit = submit;
    this.productId = productId;
    this.setResults = setResults;
  }

  private generateTempId(): string {
    this.tempIdCounter += 1;
    return `temp-${Date.now()}-${this.tempIdCounter}`;
  }

  private async processUploadQueue() {
    if (this.isUploading || this.uploadQueue.length === 0) return;

    this.isUploading = true;
    const file = this.uploadQueue.shift()!;
    const tempId = this.generateTempId();

    const formData = new FormData();
    formData.append('image', file);
    formData.append('fileName', file.name);
    formData.append('productId', this.productId);
    formData.append('tempId', tempId);

    const tempImage = {
      id: tempId,
      product_id: this.productId,
      url: URL.createObjectURL(file),
      storage_path: '',
      file_name: file.name,
      is_primary: false,
      sort_order: 0,
      created_at: new Date().toISOString(),
    };

    this.setResults(prev => ({
      ...prev,
      [tempId]: tempImage,
    }));

    try {
      // Submit and wait for completion
      await new Promise<void>(resolve => {
        this.submit(formData, {
          method: 'post',
          encType: 'multipart/form-data',
          preventScrollReset: true,
        });
        setTimeout(resolve, 500);
      });
    } finally {
      this.isUploading = false;
      // Continue with next upload
      this.processUploadQueue();
    }
  }

  override async uploadImage(file: File): Promise<ProductImage> {
    console.log('Uploading image:', file);

    // Add to queue instead of submitting immediately
    this.uploadQueue.push(file);
    this.processUploadQueue();

    // Return a minimal ProductImage object - actual info will come from server
    const tempId = this.generateTempId();
    return {
      id: tempId,
      product_id: this.productId,
      url: URL.createObjectURL(file),
      storage_path: '',
      file_name: file.name,
      is_primary: false,
      sort_order: 0,
      created_at: new Date().toISOString(),
    };
  }

  override async uploadMultipleImages(files: File[]): Promise<ProductImage[]> {
    console.log('Uploading multiple images:', files);
    this.setResults({});
    const uploads = files.map(file => this.uploadImage(file));
    return Promise.all(uploads);
  }

  override async deleteImage(imageId: string): Promise<void> {
    console.log('Attempting to delete image:', imageId);
    const formData = new FormData();
    formData.append('_action', 'delete');
    formData.append('imageId', imageId);

    this.submit(formData, { method: 'post', replace: true });
  }

  override async setPrimaryImage(imageId: string): Promise<void> {
    console.log('Setting image:', imageId, 'as primary');
    const formData = new FormData();
    formData.append('_action', 'setPrimary');
    formData.append('imageId', imageId);

    this.submit(formData, { method: 'post', replace: true });
  }

  override async updateImageOrder(imageId: string, newOrder: number): Promise<void> {
    console.log('Reordering image:', imageId, 'to:', newOrder);
    const formData = new FormData();
    formData.append('_action', 'reorder');
    formData.append('imageId', imageId);
    formData.append('newOrder', newOrder.toString());

    this.submit(formData, { method: 'post', replace: true });
  }

  override async getProductImages(): Promise<ProductImage[]> {
    console.log('Getting product images');
    // This is handled by the loader
    return Promise.resolve([]);
  }

  override async reorderImages(): Promise<void> {
    // No-op - handled by form submission
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('admin-features - Loader called');
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log('admin-features - User:', user);

  // Ensure test product exists
  const testProductId = '123e4567-e89b-12d3-a456-426614174000';
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('id', testProductId)
    .single();
  console.log('Existing product:', existingProduct);

  if (!existingProduct) {
    // Create test product if it doesn't exist
    const { error: createError } = await supabase.from('products').insert({
      id: testProductId,
      name: 'Test Product',
      sku: 'TEST-001',
      retail_price: 0,
      business_price: 0,
      stock: 0,
      is_active: true,
    });

    if (createError) {
      console.error('Error creating test product:', createError);
      throw new Error('Failed to create test product');
    }
  }

  // Get test product images
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', testProductId)
    .order('sort_order', { ascending: true })
    .limit(10);

  // Return the data with response headers
  return json(
    {
      productId: testProductId,
      images: images ?? [],
    },
    {
      headers: response.headers,
    }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const response = new Response();
    const formData = await request.formData();
    const action = formData.get('_action');

    const cookies = request.headers.get('Cookie') ?? '';
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        get: key => {
          const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
          if (!cookie) return null;
          const [, value] = cookie.trim().split('=');
          return decodeURIComponent(value);
        },
        set: (key, value) => {
          response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
        },
        remove: key => {
          response.headers.append(
            'Set-Cookie',
            `${key}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
          );
        },
      },
    });

    // Auth verification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw json({ error: 'Authentication required' }, { status: 401 });
    }

    // Role verification
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    switch (action) {
      case 'delete': {
        const imageId = formData.get('imageId');

        if (!imageId || typeof imageId !== 'string') {
          throw json({ error: 'Image ID is required' }, { status: 400 });
        }

        // Get image details
        const { data: image, error: getError } = await supabase
          .from('product_images')
          .select('storage_path')
          .eq('id', imageId)
          .single();

        if (getError || !image) {
          throw json({ error: 'Image not found' }, { status: 404 });
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove([image.storage_path]);

        if (storageError) {
          throw json({ error: 'Failed to delete image from storage' }, { status: 500 });
        }

        // Delete from database
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('id', imageId);

        if (deleteError) {
          throw json({ error: 'Failed to delete image record' }, { status: 500 });
        }

        return json({ success: true, action: 'delete', imageId }, { headers: response.headers });
      }

      case 'setPrimary': {
        const imageId = formData.get('imageId');

        if (!imageId || typeof imageId !== 'string') {
          throw json({ error: 'Image ID is required' }, { status: 400 });
        }

        // Get image details
        const { data: image, error: getError } = await supabase
          .from('product_images')
          .select('product_id, url')
          .eq('id', imageId)
          .single();

        if (getError || !image) {
          throw json({ error: 'Image not found' }, { status: 404 });
        }

        // Set as primary
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', imageId);

        if (updateError) {
          throw json({ error: 'Failed to set image as primary' }, { status: 500 });
        }

        // Reset other images
        const { error: resetError } = await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', image.product_id)
          .neq('id', imageId);

        if (resetError) {
          throw json({ error: 'Failed to reset other images' }, { status: 500 });
        }

        // Update product
        const { error: productUpdateError } = await supabase
          .from('products')
          .update({ image_url: image.url })
          .eq('id', image.product_id);

        if (productUpdateError) {
          throw json({ error: 'Failed to update product image' }, { status: 500 });
        }

        return json(
          { success: true, action: 'setPrimary', imageId },
          { headers: response.headers }
        );
      }

      case 'reorder': {
        const imageId = formData.get('imageId');
        const newOrder = formData.get('newOrder');

        if (!imageId || typeof imageId !== 'string') {
          throw json({ error: 'Image ID is required' }, { status: 400 });
        }

        if (!newOrder || typeof newOrder !== 'string') {
          throw json({ error: 'New order is required' }, { status: 400 });
        }

        const orderNum = parseInt(newOrder, 10);
        if (isNaN(orderNum)) {
          throw json({ error: 'Invalid order number' }, { status: 400 });
        }

        const { error: updateError } = await supabase
          .from('product_images')
          .update({ sort_order: orderNum })
          .eq('id', imageId);

        if (updateError) {
          throw json({ error: 'Failed to update image order' }, { status: 500 });
        }

        return json(
          { success: true, action: 'reorder', imageId, newOrder: orderNum },
          { headers: response.headers }
        );
      }

      default: {
        // Handle new image upload
        const imageData = formData.get('image') as File;
        const fileName = formData.get('fileName');
        const productId = formData.get('productId');
        const tempId = formData.get('tempId');

        if (!imageData || !(imageData instanceof File)) {
          throw json({ error: 'Image file is required' }, { status: 400 });
        }

        if (!fileName || typeof fileName !== 'string') {
          throw json({ error: 'File name is required' }, { status: 400 });
        }

        if (!productId || typeof productId !== 'string') {
          throw json({ error: 'Product ID is required' }, { status: 400 });
        }

        if (!tempId || typeof tempId !== 'string') {
          throw json({ error: 'Temp ID is required' }, { status: 400 });
        }

        // Verify product exists
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .single();

        if (productError || !product) {
          throw json({ error: 'Product not found' }, { status: 404 });
        }

        // Create unique filename
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}-${fileName}`;
        const filePath = `${productId}/${uniqueFileName}`;

        // Get file data
        const arrayBuffer = await imageData.arrayBuffer();

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, new Uint8Array(arrayBuffer), {
            cacheControl: '3600',
            upsert: false,
            contentType: imageData.type,
          });

        if (uploadError) {
          throw json({ error: 'Failed to upload image to storage' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw json({ error: 'Failed to get public URL' }, { status: 500 });
        }

        // Get current sort order
        const { data: existingImages } = await supabase
          .from('product_images')
          .select('sort_order')
          .eq('product_id', productId)
          .order('sort_order', { ascending: false })
          .limit(1);

        const nextSortOrder = (existingImages?.[0]?.sort_order ?? -1) + 1;

        // Check for existing primary image
        const { data: existingPrimary } = await supabase
          .from('product_images')
          .select('id')
          .eq('product_id', productId)
          .eq('is_primary', true)
          .maybeSingle();

        const isPrimary = !existingPrimary;

        try {
          // Create database record
          const { data: imageRecord, error: dbError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              url: urlData.publicUrl,
              storage_path: filePath,
              file_name: uniqueFileName,
              is_primary: isPrimary,
              sort_order: nextSortOrder,
              created_at: new Date().toISOString(),
              created_by: user.id,
              updated_by: user.id,
            })
            .select()
            .single();

          if (dbError) {
            throw json({ error: 'Failed to create image record' }, { status: 500 });
          }

          // Handle primary image updates if needed
          if (isPrimary) {
            const updatePromises = [
              // Update product's primary image
              supabase
                .from('products')
                .update({ image_url: urlData.publicUrl })
                .eq('id', productId),

              // Reset other images' primary status
              supabase
                .from('product_images')
                .update({ is_primary: false })
                .eq('product_id', productId)
                .neq('id', imageRecord.id),
            ];

            const results = await Promise.allSettled(updatePromises);
            const errors = results
              .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
              .map(r => r.reason);

            if (errors.length > 0) {
              console.error('Errors updating primary image status:', errors);
            }
          }

          return json(
            {
              success: true,
              image: imageRecord,
              tempId,
            },
            { headers: response.headers }
          );
        } catch (error) {
          // Cleanup uploaded file on any database operation failure
          await supabase.storage.from('product-images').remove([filePath]);
          throw error;
        }
      }
    }
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Image action error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};

export default function TestImageFeatures() {
  const { productId, images: initialImages } = useLoaderData<typeof loader>();
  const [images, setImages] = React.useState<ProductImage[]>(initialImages);
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [results, setResults] = React.useState<{ [key: string]: ProductImage }>({});

  // Create image service instance for handling uploads and modifications
  const imageService = React.useMemo(
    () => new FormSubmitImageService(submit, productId, null, setResults),
    [submit, productId]
  );

  // Update results when action data is received
  React.useEffect(() => {
    if (actionData?.success && 'image' in actionData && actionData.image && actionData.tempId) {
      setResults(prev => {
        const newResults = { ...prev };
        delete newResults[actionData.tempId];
        return newResults;
      });
    }
  }, [actionData]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Features Test Page</h1>
      <div className="space-y-8">
        {/* Wrap gallery components in DndProvider for drag-and-drop functionality */}
        <DndProvider backend={HTML5Backend}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Reorderable Gallery</h2>
            <ReorderableImageGallery
              images={images}
              imageService={imageService}
              uploading={Object.keys(results).length > 0}
              productId={productId}
              onImagesChange={setImages}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Standard Gallery</h2>
            <ProductGallery images={images} />
          </div>
        </DndProvider>
      </div>
    </div>
  );
}
