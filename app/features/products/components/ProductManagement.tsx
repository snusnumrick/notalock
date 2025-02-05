import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { ProductForm } from './ProductForm';
import { ProductService } from '../api/productService';
import { getCookieBrowser, setCookieBrowser, removeCookieBrowser } from '~/utils/cookieUtils';
import type { Product, ProductFormData, ProductManagementProps } from '../types/product.types';

export function ProductManagement({
  supabaseUrl,
  supabaseAnonKey,
  initialSession,
}: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Initialize Supabase client with browser-safe cookie handling
  const supabase = React.useMemo(() => {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: getCookieBrowser,
        set: setCookieBrowser,
        remove: removeCookieBrowser,
      },
      auth: {
        persistSession: true,
        storageKey: 'sb-session',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    client.auth.getSession().then(({ data: { session } }) => {
      console.log('Supabase Client Session:', {
        hasSession: !!session,
        sessionId: session?.access_token?.slice(0, 10),
      });
    });

    return client;
  }, [supabaseUrl, supabaseAnonKey]);

  // Initialize ProductService
  const productService = React.useMemo(() => new ProductService(supabase), [supabase]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.fetchProducts();
      setProducts(data);
    } catch (err) {
      setError(
        'Failed to load products: ' + (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  }, [productService]);

  useEffect(() => {
    if (initialSession?.data?.session) {
      setSession(initialSession.data.session);
      supabase.auth.setSession(initialSession.data.session);
    }
  }, [initialSession, supabase.auth]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (session) {
      console.log('Session token available:', !!session.access_token);
    }
  }, [session]);

  const handleAddProduct = async (formData: ProductFormData) => {
    try {
      const newProduct = await productService.createProduct(formData);
      setProducts([newProduct, ...products]);
      setShowForm(false);
    } catch (err) {
      throw err;
    }
  };

  const handleEditProduct = async (formData: ProductFormData) => {
    if (!editingProduct) return;

    try {
      const updatedProduct = await productService.updateProduct(editingProduct.id, formData);
      setProducts(products.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      setError(
        'Failed to delete product: ' + (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const filteredProducts = React.useMemo(() => {
    return products.filter(
      product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
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
            onChange={e => setSearchQuery(e.target.value)}
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
          <div className="text-center py-12 text-gray-500">No products found</div>
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
                {filteredProducts.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">{product.name}</td>
                    <td className="p-4 text-right">${product.retail_price.toFixed(2)}</td>
                    <td className="p-4 text-right">${product.business_price.toFixed(2)}</td>
                    <td className="p-4 text-right">{product.stock}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
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
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
          initialData={
            editingProduct
              ? {
                  id: editingProduct.id,
                  name: editingProduct.name,
                  sku: editingProduct.sku,
                  description: editingProduct.description || '',
                  retail_price: editingProduct.retail_price.toString(),
                  business_price: editingProduct.business_price.toString(),
                  stock: editingProduct.stock.toString(),
                  is_active: editingProduct.is_active,
                }
              : undefined
          }
          supabaseClient={supabase}
        />
      )}
    </div>
  );
}
