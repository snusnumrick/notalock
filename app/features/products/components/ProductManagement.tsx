import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Checkbox } from '~/components/ui/checkbox';
import { createBrowserClient } from '@supabase/ssr';
import { ProductForm } from './ProductForm';
import { ProductService } from '../api/productService';
import ProductSearch, { type FilterOptions } from './ProductSearch';
import BulkOperations from './BulkOperations';
import type { Product, ProductFormData, ProductManagementProps } from '../types/product.types';

export function ProductManagement({
  supabaseUrl,
  supabaseAnonKey,
  initialSession,
}: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Initialize Supabase client with browser-safe cookie handling and session
  const supabase = React.useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and anon key are required');
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => {
          if (typeof document === 'undefined') return [];
          return document.cookie.split('; ').map(cookie => {
            const [name, value] = cookie.split('=');
            return { name, value };
          });
        },
        setAll: cookies => {
          if (typeof document === 'undefined') return;
          cookies.forEach(({ name, value }) => {
            document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`;
          });
        },
      },
    });
  }, [supabaseUrl, supabaseAnonKey]);

  // Initialize ProductService
  const productService = React.useMemo(() => {
    const service = new ProductService(supabase);
    if (initialSession) {
      service.setSession(initialSession);
    }
    return service;
  }, [supabase, initialSession]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.fetchProducts(filterOptions);
      setProducts(data);
      setSelectedProducts([]);
    } catch (err) {
      setError(
        'Failed to load products: ' + (err instanceof Error ? err.message : 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  }, [productService, filterOptions]);

  useEffect(() => {
    if (initialSession) {
      supabase.auth.setSession(initialSession);
    }
    fetchProducts();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProducts();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProducts, initialSession, supabase.auth]);

  const handleAddProduct = async (formData: ProductFormData) => {
    try {
      const newProduct = await productService.createProduct(formData);
      setProducts([newProduct, ...products]);
      setShowForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create product');
      throw error;
    }
  };

  const handleEditProduct = async (formData: ProductFormData) => {
    if (!editingProduct) return;

    try {
      const updatedProduct = await productService.updateProduct(editingProduct.id, formData);
      setProducts(products.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update product');
      throw error;
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;

    try {
      await productService.deleteProduct(product.id);
      setProducts(products.filter(p => p.id !== product.id));
      setProduct(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError(
        'Failed to delete product: ' + (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await productService.bulkDeleteProducts(ids);
      await fetchProducts();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete products');
      throw error;
    }
  };

  const handleBulkUpdate = async (
    ids: string[],
    updates: {
      is_active?: boolean;
      retail_price_adjustment?: number;
      business_price_adjustment?: number;
      stock_adjustment?: number;
    }
  ) => {
    try {
      await productService.bulkUpdateProducts(ids, updates);
      await fetchProducts();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update products');
      throw error;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  return (
    <div className="p-6 bg-product-card rounded-lg shadow border border-border">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Product Management</h1>
        <div className="flex gap-2">
          <BulkOperations
            selectedIds={selectedProducts}
            onBulkDelete={handleBulkDelete}
            onBulkUpdate={handleBulkUpdate}
          />
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-btn-primary text-btn-primary-text px-4 py-2 rounded-lg hover:bg-btn-primary-hover"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="mb-6">
        <ProductSearch onFilterChange={setFilterOptions} defaultFilters={filterOptions} />
      </div>

      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6 rounded">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-accent/50 border-b border-border">
                  <th className="p-4">
                    <Checkbox
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all products"
                    />
                  </th>
                  <th className="p-4 text-left font-medium text-text-primary">SKU</th>
                  <th className="p-4 text-left font-medium text-text-primary">Name</th>
                  <th className="p-4 text-left font-medium text-text-primary">Category</th>
                  <th className="p-4 text-right font-medium text-text-primary">Retail Price</th>
                  <th className="p-4 text-right font-medium text-text-primary">Business Price</th>
                  <th className="p-4 text-right font-medium text-text-primary">Stock</th>
                  <th className="p-4 text-center font-medium text-text-primary">Status</th>
                  <th className="p-4 text-center font-medium text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr
                    key={product.id}
                    className="border-b border-border hover:bg-accent/30 text-text-primary"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={checked => handleSelectProduct(product.id, !!checked)}
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">{product.name}</td>
                    <td className="p-4">
                      {product.categories?.map(category => category.name).join(', ') || '-'}
                    </td>
                    <td className="p-4 text-right">
                      ${product.retail_price?.toFixed(2) ?? '0.00'}
                    </td>
                    <td className="p-4 text-right">
                      ${product.business_price?.toFixed(2) ?? '0.00'}
                    </td>
                    <td className="p-4 text-right">{product.stock ?? 0}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          (product.is_active ?? false)
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          className="p-2 text-btn-primary hover:bg-accent/50 rounded-lg"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProduct(product)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                          aria-label={`Delete ${product.name}`}
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
          {...(editingProduct && {
            initialData: {
              id: editingProduct.id,
              name: editingProduct.name,
              slug: editingProduct.slug,
              sku: editingProduct.sku,
              description: editingProduct.description || '',
              retail_price: editingProduct.retail_price?.toString() ?? '0',
              business_price: editingProduct.business_price?.toString() ?? '0',
              stock: editingProduct.stock?.toString() ?? '0',
              is_active: editingProduct.is_active ?? true,
              category_ids: editingProduct.categories?.map(category => category.id) ?? [],
            },
          })}
          supabaseClient={supabase}
        />
      )}

      <AlertDialog open={product !== null} onOpenChange={() => setProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {product?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProduct(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
