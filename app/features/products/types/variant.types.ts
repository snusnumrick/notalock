export interface ProductOption {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  retail_price: number;
  business_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: ProductVariantOption[];
}

export interface ProductVariantOption {
  id: string;
  variant_id: string;
  option_value_id: string;
  created_at: string;
  option_value?: ProductOptionValue;
}

export interface ProductVariantFormData {
  id?: string;
  sku: string;
  retail_price: string;
  business_price: string;
  stock: string;
  is_active: boolean;
  options: {
    [key: string]: string; // option_id: option_value_id
  };
}

export interface VariantManagementProps {
  productId: string;
  variants: ProductVariant[];
  options: ProductOption[];
  optionValues: ProductOptionValue[];
  onVariantCreate: (data: ProductVariantFormData) => Promise<void>;
  onVariantUpdate: (id: string, data: ProductVariantFormData) => Promise<void>;
  onVariantDelete: (id: string) => Promise<void>;
}
