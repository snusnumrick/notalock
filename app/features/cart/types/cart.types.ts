/**
 * Represents a shopping cart
 */
export interface Cart {
  id: string;
  user_id?: string | null;
  anonymous_id?: string | null;
  status: 'active' | 'checkout' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

/**
 * Represents an individual item in the shopping cart
 */
export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    sku: string;
    image_url: string | null;
  };
}

/**
 * Summary information for a shopping cart
 */
export interface CartSummary {
  totalItems: number;
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
}
