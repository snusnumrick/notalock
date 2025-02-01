import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"

type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
};

export function ProductForm({ isOpen, onClose, onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    retail_price: '',
    business_price: '',
    stock: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    setLoading(true);
    try {
      // Convert string prices to numbers for database
      const submissionData = {
        ...formData,
        retail_price: parseFloat(formData.retail_price),
        business_price: parseFloat(formData.business_price),
        stock: parseInt(formData.stock),
      };
      console.log('Submitting data:', submissionData);
      await onSubmit(submissionData);
      console.log('Submit successful');
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>

          <div>
            <label className="block mb-1">Product Images</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            {selectedFiles && (
              <div className="mt-2 text-sm text-gray-600">
                Selected {selectedFiles.length} file(s)
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1">Retail Price ($)</label>
              <input
                type="number"
                value={formData.retail_price}
                onChange={(e) => setFormData({...formData, retail_price: e.target.value})}
                className="w-full p-2 border rounded"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Business Price ($)</label>
              <input
                type="number"
                value={formData.business_price}
                onChange={(e) => setFormData({...formData, business_price: e.target.value})}
                className="w-full p-2 border rounded"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="w-full p-2 border rounded"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-1">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="mr-2"
              />
              Active Product
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}