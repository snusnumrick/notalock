import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { ProductFormProps, ProductFormData, ValidationErrors } from '../types/product.types';
import { validateProductForm, validateProductFiles } from '../utils/validation';

export function ProductForm({ isOpen, onClose, onSubmit, initialData }: ProductFormProps) {
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
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

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
            const submissionData = {
                ...formData,
                retail_price: formData.retail_price,
                business_price: formData.business_price,
                stock: formData.stock,
                files: selectedFiles
            };

            await onSubmit(submissionData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while saving the product');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const validationError = validateProductFiles(files);
            if (validationError) {
                setError(validationError);
                e.target.value = ''; // Clear the input
                return;
            }

            setSelectedFiles(files);
            setError(null);
        }
    };

    const handleInputChange = (
        field: keyof ProductFormData,
        value: string | boolean
    ) => {
        setFormData({ ...formData, [field]: value });
        if (validationErrors[field]) {
            const { [field]: _, ...rest } = validationErrors;
            setValidationErrors(rest);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">
                                Name
                                {validationErrors.name && (
                                    <span className="text-red-500 text-sm ml-2">
                                        {validationErrors.name}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`mt-1 block w-full rounded-md text-sm shadow-sm ${
                                    validationErrors.name
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                SKU
                                {validationErrors.sku && (
                                    <span className="text-red-500 text-sm ml-2">
                                        {validationErrors.sku}
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => handleInputChange('sku', e.target.value)}
                                className={`mt-1 block w-full rounded-md text-sm shadow-sm ${
                                    validationErrors.sku
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Product Images</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0 file:text-sm file:font-medium
                                    file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                                    focus:outline-none"
                            />
                            <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        {selectedFiles && (
                            <p className="mt-2 text-sm text-gray-500">
                                Selected {selectedFiles.length} file(s)
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium">
                                Retail Price ($)
                                {validationErrors.retail_price && (
                                    <span className="text-red-500 text-sm ml-2">
                                        {validationErrors.retail_price}
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                value={formData.retail_price}
                                onChange={(e) => handleInputChange('retail_price', e.target.value)}
                                className={`mt-1 block w-full rounded-md text-sm shadow-sm ${
                                    validationErrors.retail_price
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Business Price ($)
                                {validationErrors.business_price && (
                                    <span className="text-red-500 text-sm ml-2">
                                        {validationErrors.business_price}
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                value={formData.business_price}
                                onChange={(e) => handleInputChange('business_price', e.target.value)}
                                className={`mt-1 block w-full rounded-md text-sm shadow-sm ${
                                    validationErrors.business_price
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">
                                Stock
                                {validationErrors.stock && (
                                    <span className="text-red-500 text-sm ml-2">
                                        {validationErrors.stock}
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => handleInputChange('stock', e.target.value)}
                                className={`mt-1 block w-full rounded-md text-sm shadow-sm ${
                                    validationErrors.stock
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="text-sm font-medium">Active Product</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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