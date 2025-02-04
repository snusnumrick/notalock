import type { ProductFormData, ValidationErrors } from '../types/product.types';

export const validateProductForm = (formData: ProductFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!formData.sku.trim()) {
    errors.sku = 'SKU is required';
  }

  const retail = parseFloat(formData.retail_price);
  if (isNaN(retail) || retail < 0) {
    errors.retail_price = 'Please enter a valid retail price';
  }

  const business = parseFloat(formData.business_price);
  if (isNaN(business) || business < 0) {
    errors.business_price = 'Please enter a valid business price';
  }

  const stock = parseInt(formData.stock);
  if (isNaN(stock) || stock < 0) {
    errors.stock = 'Please enter a valid stock quantity';
  }

  return errors;
};

export const validateProductFiles = (files: FileList): string | null => {
  const validFiles = Array.from(files).every(file => {
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
    return isValidType && isValidSize;
  });

  if (!validFiles) {
    return 'Please only upload image files (JPG, PNG, WebP) under 5MB';
  }

  return null;
};
