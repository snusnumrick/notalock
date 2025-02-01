import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { ProductForm } from './ProductForm';
import { createBrowserClient } from '@supabase/ssr';

export function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [supabase] = useState(() => 
    createBrowserClient(
      window.env.SUPABASE_URL,
      window.env.SUPABASE_ANON_KEY
    )
  );
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Check auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      
      console.log('Current session:', session);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Products loaded:', data);
      setProducts(data || []);
    } catch (err) {
      console.error('Detailed error:', err);
      setError('Failed to load products: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (formData) => {
    try {
      console.log('Handling add product:', formData);
      
      // Check auth status first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      
      console.log('Current session before adding product:', session);

      // First, insert the product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          retail_price: formData.retail_price,
          business_price: formData.business_price,
          stock: formData.stock,
          is_active: formData.is_active
        })
        .select()
        .single();

      if (productError) {
        console.error('Product insert error:', productError);
        throw productError;
      }
      console.log('Product created:', productData);

      // If there are files, upload them
      if (formData.files && formData.files.length > 0) {
        console.log('Uploading files:', formData.files);
        for (const file of formData.files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${productData.id}/${Date.now()}.${fileExt}`;
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;
          console.log('File uploaded:', fileName);

          // Create database record
          const { error: imageError } = await supabase
            .from('product_images')
            .insert({
              product_id: productData.id,
              url: fileName,
              is_primary: false
            });

          if (imageError) throw imageError;
          console.log('Image record created');
        }
      }

      // Fetch the updated product with images
      const { data: updatedProduct, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*)
        `)
        .eq('id', productData.id)
        .single();

      if (fetchError) throw fetchError;

      setProducts([updatedProduct, ...products]);
      setShowForm(false);
      console.log('Product added successfully');
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  };

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
                {products.filter(product =>
                  product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">{product.name}</td>
                    <td className="p-4 text-right">
                      ${product.retail_price?.toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      ${product.business_price?.toFixed(2)}
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