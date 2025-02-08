import { useState, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantFormData,
} from '../types/variant.types';
import {
  getProductOptions,
  getProductOptionValues,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from '../api/variantService';

export const useVariants = (supabaseClient: SupabaseClient, productId: string | undefined) => {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [optionValues, setOptionValues] = useState<ProductOptionValue[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const [loadedOptions, loadedOptionValues, loadedVariants] = await Promise.all([
          getProductOptions(supabaseClient),
          getProductOptionValues(supabaseClient),
          getProductVariants(supabaseClient, productId),
        ]);

        setOptions(loadedOptions);
        setOptionValues(loadedOptionValues);
        setVariants(loadedVariants);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load variant data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabaseClient, productId]);

  const handleVariantCreate = async (data: ProductVariantFormData) => {
    if (!productId) return;

    try {
      const newVariant = await createProductVariant(supabaseClient, productId, data);
      setVariants(prev => [...prev, newVariant]);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create variant');
    }
  };

  const handleVariantUpdate = async (variantId: string, data: ProductVariantFormData) => {
    try {
      const updatedVariant = await updateProductVariant(supabaseClient, variantId, data);
      setVariants(prev =>
        prev.map(variant => (variant.id === variantId ? updatedVariant : variant))
      );
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update variant');
    }
  };

  const handleVariantDelete = async (variantId: string) => {
    try {
      await deleteProductVariant(supabaseClient, variantId);
      setVariants(prev => prev.filter(variant => variant.id !== variantId));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete variant');
    }
  };

  return {
    options,
    optionValues,
    variants,
    loading,
    error,
    handleVariantCreate,
    handleVariantUpdate,
    handleVariantDelete,
  };
};
