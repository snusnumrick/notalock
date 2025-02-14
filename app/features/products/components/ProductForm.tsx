import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import ReorderableImageGallery from './ReorderableImageGallery';
import { TempImageGallery } from './TempImageGallery';
import { ProductImageService } from '../api/productImageService';
import { CategoryService } from '~/features/categories/api/categoryService';
import { useVariants } from '../hooks/useVariants';
import VariantManagement from './VariantManagement';
import type {
  ProductFormProps,
  ProductFormData,
  ValidatedFields,
  FormFields,
  ValidationErrors,
  ProductImage,
  TempImage,
} from '../types/product.types';
import type { Category } from '~/features/categories/types/category.types';
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
    category_ids: initialData?.categories?.map(({ category }) => category.id) || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const {
    options,
    optionValues,
    variants,
    error: variantsError,
    handleVariantCreate,
    handleVariantUpdate,
    handleVariantDelete,
  } = useVariants(supabaseClient, initialData?.id);

  const imageService = React.useMemo(
    () => new ProductImageService(supabaseClient),
    [supabaseClient]
  );

  const categoryService = React.useMemo(
    () => new CategoryService(supabaseClient),
    [supabaseClient]
  );

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await categoryService.fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [categoryService]);

  // Fetch existing images if editing a product
  useEffect(() => {
    if (initialData?.id) {
      imageService
        .getProductImages(initialData.id)
        .then(productImages => setImages(productImages))
        .catch(err => console.error('Failed to load product images:', err));
    }
  }, [initialData?.id, imageService]);

  const handleInputChange = (
    field: FormFields | 'category_ids',
    value: string | boolean | string[]
  ) => {
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
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

              {/* Categories Field */}
              <div>
                <label htmlFor="categories" className="text-sm font-medium">
                  Categories
                </label>
                <select
                  id="categories"
                  multiple
                  value={formData.category_ids}
                  onChange={e => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                      option => option.value
                    );
                    handleInputChange('category_ids', selectedOptions);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {loadingCategories && (
                  <div className="text-sm text-gray-500">Loading categories...</div>
                )}
              </div>

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
                      <span className="text-red-500 text-sm ml-2">
                        {validationErrors.retail_price}
                      </span>
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
            </form>
          </TabsContent>

          <TabsContent value="variants">
            {variantsError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {variantsError instanceof Error
                    ? variantsError.message
                    : 'Failed to load variants'}
                </AlertDescription>
              </Alert>
            ) : (
              <VariantManagement
                productId={initialData?.id}
                variants={variants}
                options={options}
                optionValues={optionValues}
                onVariantCreate={handleVariantCreate}
                onVariantUpdate={handleVariantUpdate}
                onVariantDelete={handleVariantDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="images">
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 pt-4 border-t mt-4">
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
            form="product-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
