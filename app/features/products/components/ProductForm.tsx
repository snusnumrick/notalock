import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Alert, AlertDescription } from '~/components/ui/alert';
import ReorderableImageGallery from './ReorderableImageGallery';
import { TempImageGallery } from './TempImageGallery';
import { ProductImageService } from '../api/productImageService';
import type {
  ProductFormProps,
  ProductFormData,
  ValidatedFields,
  FormFields,
  ValidationErrors,
  ProductImage,
  TempImage,
} from '../types/product.types';
import { validateProductForm } from '../utils/validation';

export function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  supabaseClient,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    description: initialData?.description || '',
    retail_price: initialData?.retail_price?.toString() || '',
    business_price: initialData?.business_price?.toString() || '',
    stock: initialData?.stock?.toString() || '',
    is_active: initialData?.is_active ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [tempImages, setTempImages] = useState<TempImage[]>([]);

  const imageService = React.useMemo(
    () => new ProductImageService(supabaseClient),
    [supabaseClient]
  );

  // Fetch existing images if editing a product
  useEffect(() => {
    if (initialData?.id) {
      imageService
        .getProductImages(initialData.id)
        .then(productImages => setImages(productImages))
        .catch(err => console.error('Failed to load product images:', err));
    }
  }, [initialData?.id, imageService]);

  const handleInputChange = (field: FormFields, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (field in validationErrors) {
      const errors = { ...validationErrors };
      delete errors[field as ValidatedFields];
      setValidationErrors(errors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors = validateProductForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // Include temp images in the submission if creating a new product
      const submitData = {
        ...formData,
        tempImages: initialData?.id ? undefined : tempImages,
      };

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name
                {validationErrors.name && (
                  <span className="text-red-500 text-sm ml-2">{validationErrors.name}</span>
                )}
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`mt-1 block w-full rounded-md text-sm ${
                  validationErrors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                required
              />
            </div>

            {/* SKU Field */}
            <div>
              <label htmlFor="sku" className="text-sm font-medium">
                SKU
                {validationErrors.sku && (
                  <span className="text-red-500 text-sm ml-2">{validationErrors.sku}</span>
                )}
              </label>
              <input
                id="sku"
                type="text"
                value={formData.sku}
                onChange={e => handleInputChange('sku', e.target.value)}
                className={`mt-1 block w-full rounded-md text-sm ${
                  validationErrors.sku
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                required
              />
            </div>
          </div>

          {/* Rest of the form fields... */}
          {/* Description Field */}
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Retail Price Field */}
            <div>
              <label htmlFor="retail_price" className="text-sm font-medium">
                Retail Price ($)
                {validationErrors.retail_price && (
                  <span className="text-red-500 text-sm ml-2">{validationErrors.retail_price}</span>
                )}
              </label>
              <input
                id="retail_price"
                type="number"
                value={formData.retail_price}
                onChange={e => handleInputChange('retail_price', e.target.value)}
                className={`mt-1 block w-full rounded-md text-sm ${
                  validationErrors.retail_price
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Business Price Field */}
            <div>
              <label htmlFor="business_price" className="text-sm font-medium">
                Business Price ($)
                {validationErrors.business_price && (
                  <span className="text-red-500 text-sm ml-2">
                    {validationErrors.business_price}
                  </span>
                )}
              </label>
              <input
                id="business_price"
                type="number"
                value={formData.business_price}
                onChange={e => handleInputChange('business_price', e.target.value)}
                className={`mt-1 block w-full rounded-md text-sm ${
                  validationErrors.business_price
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Stock Field */}
            <div>
              <label htmlFor="stock" className="text-sm font-medium">
                Stock
                {validationErrors.stock && (
                  <span className="text-red-500 text-sm ml-2">{validationErrors.stock}</span>
                )}
              </label>
              <input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={e => handleInputChange('stock', e.target.value)}
                className={`mt-1 block w-full rounded-md text-sm ${
                  validationErrors.stock
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                min="0"
                required
              />
            </div>
          </div>

          {/* Active Status Field */}
          <div>
            <label htmlFor="is_active" className="flex items-center space-x-2">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={e => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm font-medium">Active Product</span>
            </label>
          </div>

          {/* Image Gallery */}
          <div className="space-y-2">
            <label htmlFor="product-images" className="text-sm font-medium">
              Product Images
            </label>
            {initialData?.id ? (
              <ReorderableImageGallery
                productId={initialData.id}
                images={images}
                onImagesChange={setImages}
                imageService={imageService}
              />
            ) : (
              <TempImageGallery images={tempImages} onImagesChange={setTempImages} />
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
