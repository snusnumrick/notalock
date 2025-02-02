import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { ProductForm } from './ProductForm';
import { createBrowserClient } from '@supabase/ssr';
import { useLoaderData } from '@remix-run/react';
import type { Session } from '@supabase/supabase-js';

interface LoaderData {
  session: Session | null;
  profile: { role: string } | null;
  env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  };
}

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  retail_price: number;
  business_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  product_images: ProductImage[];
}

interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  is_primary: boolean;
  created_at: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  retail_price: string;
  business_price: string;
  stock: string;
  is_active: boolean;
  files?: FileList | null;
}

interface ProductManagementProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function ProductManagement({ supabaseUrl, supabaseAnonKey }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  const supabase = React.useMemo(() => createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  ), [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_images (*)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        setError('Failed to load products: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [supabase, mounted]);

  const filteredProducts = React.useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddProduct = async (formData: ProductFormData) => {
    try {
      const { data: productData, error: productError } = await supabase
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

      if (formData.files && formData.files.length > 0) {
        for (const file of formData.files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${productData.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { error: imageError } = await supabase
            .from('product_images')
            .insert({
              product_id: productData.id,
              url: fileName,
              is_primary: false
            });

          if (imageError) throw imageError;
        }
      }

      const { data: updatedProduct, error: fetchError } = await supabase
        .from('products')
        .select('*, product_images (*)')
        .eq('id', productData.id)
        .single();

      if (fetchError) throw fetchError;

      setProducts([updatedProduct as Product, ...products]);
      setShowForm(false);
    } catch (err) {
      throw err;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left">SKU</th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-right">Retail Price</th>
                  <th className="p-4 text-right">Business Price</th>
                  <th className="p-4 text-right">Stock</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">{product.name}</td>
                    <td className="p-4 text-right">
                      ${product.retail_price.toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      ${product.business_price.toFixed(2)}
                    </td>
                    <td className="p-4 text-right">{product.stock}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            console.log('Edit clicked', product.id);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete clicked', product.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleAddProduct}
        />
      )}
    </div>
  );
}