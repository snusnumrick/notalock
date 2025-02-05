import React from 'react';
import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit, useActionData } from '@remix-run/react';
import { createServerClient } from '@supabase/ssr';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReorderableImageGallery from '~/features/products/components/ReorderableImageGallery';
import ProductGallery from '~/features/products/components/ProductGallery';
import type { ProductImage } from '~/features/products/types/product.types';
import { ProductImageService } from '~/features/products/api/productImageService';

// Create an adapter that extends the ProductImageService class
class FormSubmitImageService extends ProductImageService {
  private submit: ReturnType<typeof useSubmit>;
  private productId: string;
  private setResults: React.Dispatch<React.SetStateAction<{ [key: string]: ProductImage }>>;
  private setUploadingCount: React.Dispatch<React.SetStateAction<number>>;
  private uploadQueue: File[] = [];
  private isUploading = false;
  private tempIdCounter = 0;

  constructor(
    submit: ReturnType<typeof useSubmit>,
    productId: string,
    _: null,
    setResults: React.Dispatch<React.SetStateAction<{ [key: string]: ProductImage }>>,
    setUploadingCount: React.Dispatch<React.SetStateAction<number>>
  ) {
    console.log('Creating FormSubmitImageService with productId:', productId);
    super({} as SupabaseClient);
    this.submit = submit;
    this.productId = productId;
    this.setResults = setResults;
    this.setUploadingCount = setUploadingCount;
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
    this.setUploadingCount(files.length);
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
  console.log('Loader called');
  const response = new Response();
  const cookies = request.headers.get('Cookie') ?? '';

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get: key => {
        console.log('Getting cookie:', key);
        const cookie = cookies.split(';').find(c => c.trim().startsWith(`${key}=`));
        if (!cookie) return null;
        const [, value] = cookie.trim().split('=');
        return decodeURIComponent(value);
      },
      set: (key, value) => {
        console.log('Setting cookie:', key, value);
        response.headers.append('Set-Cookie', `${key}=${value}; Path=/; HttpOnly; SameSite=Lax`);
      },
      remove: key => {
        console.log('Removing cookie:', key);
        response.headers.append(
          'Set-Cookie',
          `${key}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
        );
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  console.log('User:', user);

  if (userError || !user) {
    return redirect('/login');
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  console.log('Profile:', profile);

  if (profile?.role !== 'admin') {
    return redirect('/unauthorized');
  }

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

  console.log('User:', user.email);
  console.log('Loader profile:', profile);

  return json(
    {
      images: images || [],
      user,
      profile,
      testProductId,
    },
    { headers: response.headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const response = new Response();
  const formData = await request.formData();
  const action = formData.get('_action');
  console.log('Action:', action);

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

  // Get user and verify auth
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    return json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  console.log('action:', action);
  console.log('User:', user.email);
  console.log('Profile:', profile);

  try {
    switch (action) {
      case 'delete': {
        const imageId = formData.get('imageId') as string;
        console.log('Deleting image:', imageId);
        console.log('Session user:', user.email);
        console.log('Profile:', profile);

        try {
          // First get the image details to know the storage path
          const { data: image, error: getError } = await supabase
            .from('product_images')
            .select('storage_path')
            .eq('id', imageId)
            .single();

          console.log('Image data:', image, 'Get error:', getError);

          if (getError) throw getError;
          if (!image) throw new Error('Image not found');

          console.log('Attempting to delete from storage:', image.storage_path);

          // Delete from storage first
          const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove([image.storage_path]);

          console.log('Storage delete error:', storageError);

          if (storageError) throw storageError;

          // Then delete from database
          const { error: deleteError } = await supabase
            .from('product_images')
            .delete()
            .eq('id', imageId);

          console.log('Database delete error:', deleteError);

          if (deleteError) throw deleteError;

          return json({ success: true, action: 'delete', imageId });
        } catch (error) {
          console.error('Full delete error:', error);
          throw error;
        }
      }

      case 'setPrimary': {
        const imageId = formData.get('imageId') as string;

        // First get the image details to get the product_id
        const { data: image, error: getError } = await supabase
          .from('product_images')
          .select('product_id, url')
          .eq('id', imageId)
          .single();

        if (getError) throw getError;
        if (!image) throw new Error('Image not found');

        // First set the selected image as primary
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', imageId);

        if (updateError) throw updateError;

        // Then remove primary status from all other images of this product
        const { error: resetError } = await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', image.product_id)
          .neq('id', imageId);

        if (resetError) throw resetError;

        if (updateError) throw updateError;

        // Also update the product's primary image URL if needed
        const { error: productUpdateError } = await supabase
          .from('products')
          .update({ image_url: image.url })
          .eq('id', image.product_id);

        if (productUpdateError) throw productUpdateError;

        return json({ success: true, action: 'setPrimary', imageId });
      }

      case 'reorder': {
        const imageId = formData.get('imageId') as string;
        const newOrder = parseInt(formData.get('newOrder') as string);

        // Handle reordering
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ sort_order: newOrder })
          .eq('id', imageId);

        if (updateError) throw updateError;

        return json({ success: true, action: 'reorder', imageId, newOrder });
      }

      default: {
        const imageData = formData.get('image') as File;
        const fileName = formData.get('fileName') as string;
        const productId = formData.get('productId') as string;
        const tempId = formData.get('tempId') as string;

        if (!imageData || !fileName || !productId) {
          return json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify product exists
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .single();

        if (!product) {
          return json({ error: 'Product not found' }, { status: 404 });
        }

        // Create a unique filename
        const timestamp = new Date().getTime();
        const uniqueFileName = `${timestamp}-${fileName}`;
        const filePath = `${productId}/${uniqueFileName}`;
        console.log('Uploading image:', filePath);

        // Get the ArrayBuffer from the File
        const arrayBuffer = await imageData.arrayBuffer();

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, new Uint8Array(arrayBuffer), {
            cacheControl: '3600',
            upsert: false,
            contentType: imageData.type,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        console.log('Public URL:', urlData);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL');
        }

        // Get current sort order
        const { data: existingImages } = await supabase
          .from('product_images')
          .select('id, sort_order')
          .eq('product_id', productId)
          .order('sort_order', { ascending: false })
          .limit(1);

        const nextSortOrder = (existingImages?.[0]?.sort_order ?? -1) + 1;

        // Create database record with all required fields
        const { data: imageRecord, error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            url: urlData.publicUrl,
            storage_path: filePath,
            file_name: uniqueFileName,
            is_primary: false,
            sort_order: nextSortOrder,
            created_at: new Date().toISOString(),
          })
          .select('*') // Select all fields to ensure we get a complete record
          .single();

        if (dbError) {
          // Try to clean up the uploaded file
          await supabase.storage.from('product-images').remove([filePath]);
          throw dbError;
        }

        return json(
          {
            success: true,
            image: imageRecord,
            tempId,
          },
          { headers: response.headers }
        );
      }
    }
  } catch (error) {
    console.error('Action error:', error);
    return json(
      {
        error: 'Action failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: response.headers }
    );
  }
};

export default function TestImageFeatures() {
  const { images, user, testProductId } = useLoaderData<typeof loader>();
  const [adminImages, setAdminImages] = React.useState(images);
  const [uploadResults, setUploadResults] = React.useState<{ [key: string]: ProductImage }>({});
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Keep track of uploads in progress
  const [, setUploadingCount] = React.useState(0);

  const imageService = React.useMemo(
    () =>
      new FormSubmitImageService(submit, testProductId, null, setUploadResults, setUploadingCount),
    [submit, testProductId, setUploadResults, setUploadingCount]
  );

  // Handle completion of all uploads
  const handleUploadsComplete = React.useCallback(() => {
    window.location.reload();
  }, []);

  // Handle submission state
  React.useEffect(() => {
    if (submit.state === 'submitting') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [submit.state]);

  // Handle action responses
  React.useEffect(() => {
    if (actionData?.error) {
      setError(
        actionData.details ? `${actionData.error}: ${actionData.details}` : actionData.error
      );
    } else if (actionData?.success) {
      console.log('Action success:', actionData);
      switch (actionData.action) {
        case 'delete':
          window.location.reload();
          break;

        case 'setPrimary':
          setAdminImages(prev =>
            prev.map(img => ({
              ...img,
              is_primary: img.id === actionData.imageId,
            }))
          );
          window.location.reload();
          break;

        case 'reorder':
          window.location.reload();
          break;

        default:
          if (actionData.image && actionData.tempId) {
            const { tempId } = actionData;
            setAdminImages(prev => prev.map(img => (img.id === tempId ? actionData.image : img)));
            setUploadResults(prev => {
              const next = { ...prev };
              delete next[tempId];
              return next;
            });
            setUploadingCount(count => {
              const newCount = count - 1;
              if (newCount === 0) {
                setTimeout(handleUploadsComplete, 100);
              }
              return newCount;
            });
            window.location.reload();
          }
      }
    }
  }, [actionData, handleUploadsComplete]);

  // Handle upload results changes
  React.useEffect(() => {
    const resultValues = Object.values(uploadResults);
    if (resultValues.length > 0) {
      setAdminImages(prev => {
        // First remove any temp images that were replaced
        const withoutTemp = prev.filter(
          img => !img.id.startsWith('temp-') || uploadResults[img.id]
        );
        // Then add any new temp images
        const newImages = resultValues.filter(
          tempImg => !withoutTemp.some(img => img.id === tempImg.id)
        );
        return [...withoutTemp, ...newImages];
      });
    }
  }, [uploadResults]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Error</h3>
              <div className="mt-2 text-sm">{error}</div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 space-y-12">
          <div>
            <h3 className="text-xl font-semibold leading-6 text-gray-900">
              Image Management Test Page
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Test all new image management features including multi-upload, reordering, and
                gallery view.
              </p>
            </div>
          </div>

          {/* Admin Interface */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              Admin Interface (ReorderableImageGallery)
            </h2>
            <p className="text-sm text-gray-500">
              Test features: multi-upload, drag-and-drop reordering, primary image selection,
              deletion
            </p>
            <div className="mt-4 border rounded-lg p-6 bg-gray-50">
              <DndProvider backend={HTML5Backend}>
                <ReorderableImageGallery
                  productId={testProductId}
                  images={adminImages}
                  onImagesChange={setAdminImages}
                  imageService={imageService}
                />
              </DndProvider>
            </div>
          </section>

          {/* Customer Interface */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              Customer Interface (ProductGallery)
            </h2>
            <p className="text-sm text-gray-500">
              Test features: zoom, lightbox, touch swipe, keyboard navigation
            </p>
            <div className="mt-4 border rounded-lg p-6 bg-gray-50">
              <ProductGallery images={adminImages} />
            </div>
          </section>

          {/* Debug Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Debug Information</h2>
            <div className="mt-4 border rounded-lg p-6 bg-gray-100">
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(
                  {
                    imageCount: adminImages.length,
                    images: adminImages,
                    user: user?.email,
                    latestAction: actionData,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
