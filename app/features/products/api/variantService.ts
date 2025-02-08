import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantFormData,
} from '../types/variant.types';

export const getProductOptions = async (
  supabaseClient: SupabaseClient
): Promise<ProductOption[]> => {
  const { data, error } = await supabaseClient.from('product_options').select('*').order('name');

  if (error) throw error;
  return data;
};

export const getProductOptionValues = async (
  supabaseClient: SupabaseClient
): Promise<ProductOptionValue[]> => {
  const { data, error } = await supabaseClient
    .from('product_option_values')
    .select('*')
    .order('value');

  if (error) throw error;
  return data;
};

export const getProductVariants = async (
  supabaseClient: SupabaseClient,
  productId: string
): Promise<ProductVariant[]> => {
  const { data, error } = await supabaseClient
    .from('product_variants')
    .select(
      `
            *,
            options:product_variant_options (
                *,
                option_value:product_option_values (*)
            )
        `
    )
    .eq('product_id', productId)
    .order('created_at');

  if (error) throw error;
  return data;
};

export const createProductVariant = async (
  supabaseClient: SupabaseClient,
  productId: string,
  formData: ProductVariantFormData
): Promise<ProductVariant> => {
  // Start a transaction
  const { data: variant, error: variantError } = await supabaseClient
    .from('product_variants')
    .insert({
      product_id: productId,
      sku: formData.sku,
      retail_price: parseFloat(formData.retail_price),
      business_price: parseFloat(formData.business_price),
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
    })
    .select()
    .single();

  if (variantError) throw variantError;

  // Create variant options
  const optionPromises = Object.entries(formData.options).map(([, valueId]) =>
    supabaseClient.from('product_variant_options').insert({
      variant_id: variant.id,
      option_value_id: valueId,
    })
  );

  await Promise.all(optionPromises);

  // Return the created variant with its options
  const { data: variantWithOptions, error: fetchError } = await supabaseClient
    .from('product_variants')
    .select(
      `
            *,
            options:product_variant_options (
                *,
                option_value:product_option_values (*)
            )
        `
    )
    .eq('id', variant.id)
    .single();

  if (fetchError) throw fetchError;
  return variantWithOptions;
};

export const updateProductVariant = async (
  supabaseClient: SupabaseClient,
  variantId: string,
  formData: ProductVariantFormData
): Promise<ProductVariant> => {
  // Update variant data
  const { error: variantError } = await supabaseClient
    .from('product_variants')
    .update({
      sku: formData.sku,
      retail_price: parseFloat(formData.retail_price),
      business_price: parseFloat(formData.business_price),
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
    })
    .eq('id', variantId);

  if (variantError) throw variantError;

  // Delete existing options
  const { error: deleteError } = await supabaseClient
    .from('product_variant_options')
    .delete()
    .eq('variant_id', variantId);

  if (deleteError) throw deleteError;

  // Create new options
  const optionPromises = Object.entries(formData.options).map(([, valueId]) =>
    supabaseClient.from('product_variant_options').insert({
      variant_id: variantId,
      option_value_id: valueId,
    })
  );

  await Promise.all(optionPromises);

  // Return the updated variant with its options
  const { data: variant, error: fetchError } = await supabaseClient
    .from('product_variants')
    .select(
      `
            *,
            options:product_variant_options (
                *,
                option_value:product_option_values (*)
            )
        `
    )
    .eq('id', variantId)
    .single();

  if (fetchError) throw fetchError;
  return variant;
};

export const deleteProductVariant = async (
  supabaseClient: SupabaseClient,
  variantId: string
): Promise<void> => {
  // Delete variant (this will cascade delete options due to foreign key constraint)
  const { error } = await supabaseClient.from('product_variants').delete().eq('id', variantId);

  if (error) throw error;
};

export const createOptionValue = async (
  supabaseClient: SupabaseClient,
  optionId: string,
  value: string
): Promise<ProductOptionValue> => {
  const { data, error } = await supabaseClient
    .from('product_option_values')
    .insert({
      option_id: optionId,
      value: value,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
