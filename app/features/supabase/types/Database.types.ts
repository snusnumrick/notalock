// Database schema definitions (tables, views, functions)
// JSON type definition
// These are the core type definitions for your database structure

// Add this export statement
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CheckoutStep = 'information' | 'shipping' | 'payment' | 'review' | 'confirmation';
export type OrderStatus = 'created' | 'processing' | 'completed' | 'cancelled' | 'refunded';
export type PaymentMethodType = 'credit_card' | 'paypal' | 'bank_transfer' | 'square';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type UserRole = 'customer' | 'business' | 'admin';
export type CartStatus =
  | 'active'
  | 'merged'
  | 'checkout'
  | 'completed'
  | 'abandoned'
  | 'duplicate'
  | 'cleared'
  | 'consolidated';

export interface Database {
  public: {
    Tables: {
      checkout_sessions: {
        Row: {
          id: string;
          cart_id: string;
          user_id: string | null;
          guest_email: string | null;
          shipping_address: Json | null;
          billing_address: Json | null;
          shipping_method: string | null;
          shipping_option: Json | null;
          payment_method: string | null;
          payment_info: Json | null;
          current_step: CheckoutStep;
          subtotal: number;
          shipping_cost: number;
          tax: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          user_id?: string | null;
          guest_email?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          shipping_method?: string | null;
          shipping_option?: Json | null;
          payment_method?: string | null;
          payment_info?: Json | null;
          current_step?: CheckoutStep;
          subtotal?: number;
          shipping_cost?: number;
          tax?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          user_id?: string | null;
          guest_email?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          shipping_method?: string | null;
          shipping_option?: Json | null;
          payment_method?: string | null;
          payment_info?: Json | null;
          current_step?: CheckoutStep;
          subtotal?: number;
          shipping_cost?: number;
          tax?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'checkout_sessions_cart_id_fkey';
            columns: ['cart_id'];
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'checkout_sessions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          checkout_session_id: string | null;
          cart_id: string | null;
          user_id: string | null;
          guest_email: string | null;
          order_number: string;
          status: string;
          shipping_address: Json;
          billing_address: Json;
          shipping_method: string;
          shipping_cost: number;
          subtotal: number;
          tax: number;
          total: number;
          payment_method: string;
          payment_status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          checkout_session_id?: string | null;
          cart_id?: string | null;
          user_id?: string | null;
          guest_email?: string | null;
          order_number: string;
          status?: string;
          shipping_address: Json;
          billing_address: Json;
          shipping_method: string;
          shipping_cost?: number;
          subtotal?: number;
          tax?: number;
          total?: number;
          payment_method: string;
          payment_status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          checkout_session_id?: string | null;
          cart_id?: string | null;
          user_id?: string | null;
          guest_email?: string | null;
          order_number?: string;
          status?: string;
          shipping_address?: Json;
          billing_address?: Json;
          shipping_method?: string;
          shipping_cost?: number;
          subtotal?: number;
          tax?: number;
          total?: number;
          payment_method?: string;
          payment_status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_checkout_session_id_fkey';
            columns: ['checkout_session_id'];
            referencedRelation: 'checkout_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_cart_id_fkey';
            columns: ['cart_id'];
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          name: string;
          sku: string;
          quantity: number;
          price: number;
          image_url: string | null;
          options: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          name: string;
          sku: string;
          quantity: number;
          price: number;
          image_url?: string | null;
          options?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          variant_id?: string | null;
          name?: string;
          sku?: string;
          quantity?: number;
          price?: number;
          image_url?: string | null;
          options?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_audit_log: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_audit_log_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_permissions: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          can_manage_products: boolean;
          can_view_products: boolean;
          can_manage_categories: boolean;
          can_view_categories: boolean;
          can_manage_orders: boolean;
          can_view_orders: boolean;
          can_manage_users: boolean;
          can_view_users: boolean;
          can_manage_all_products: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          can_manage_products?: boolean;
          can_view_products?: boolean;
          can_manage_categories?: boolean;
          can_view_categories?: boolean;
          can_manage_orders?: boolean;
          can_view_orders?: boolean;
          can_manage_users?: boolean;
          can_view_users?: boolean;
          can_manage_all_products?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          can_manage_products?: boolean;
          can_view_products?: boolean;
          can_manage_categories?: boolean;
          can_view_categories?: boolean;
          can_manage_orders?: boolean;
          can_view_orders?: boolean;
          can_manage_users?: boolean;
          can_view_users?: boolean;
          can_manage_all_products?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_permissions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          variant_id?: string | null;
          quantity?: number;
          price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey';
            columns: ['cart_id'];
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string | null;
          status: CartStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          status?: CartStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          status?: CartStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'carts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          position: number;
          is_active: boolean;
          sort_order: number;
          is_visible: boolean;
          status: string | null;
          is_highlighted: boolean;
          highlight_priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          parent_id?: string | null;
          position?: number;
          is_active?: boolean;
          sort_order?: number;
          is_visible?: boolean;
          status?: string | null;
          is_highlighted?: boolean;
          highlight_priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          parent_id?: string | null;
          position?: number;
          is_active?: boolean;
          sort_order?: number;
          is_visible?: boolean;
          status?: string | null;
          is_highlighted?: boolean;
          highlight_priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      hero_banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          image_url: string;
          cta_text: string | null;
          cta_link: string | null;
          secondary_cta_text: string | null;
          secondary_cta_link: string | null;
          is_active: boolean;
          position: number;
          background_color: string | null;
          text_color: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          image_url: string;
          cta_text?: string | null;
          cta_link?: string | null;
          secondary_cta_text?: string | null;
          secondary_cta_link?: string | null;
          is_active?: boolean;
          position?: number;
          background_color?: string | null;
          text_color?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          image_url?: string;
          cta_text?: string | null;
          cta_link?: string | null;
          secondary_cta_text?: string | null;
          secondary_cta_link?: string | null;
          is_active?: boolean;
          position?: number;
          background_color?: string | null;
          text_color?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hero_banners_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: {
          product_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          product_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_categories_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          url: string;
          storage_path: string;
          file_name: string;
          is_primary: boolean;
          sort_order: number;
          alt_text: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          url: string;
          storage_path: string;
          file_name: string;
          is_primary?: boolean;
          sort_order?: number;
          alt_text?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          url?: string;
          storage_path?: string;
          file_name?: string;
          is_primary?: boolean;
          sort_order?: number;
          alt_text?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_option_values: {
        Row: {
          id: string;
          option_id: string;
          value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          option_id: string;
          value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          option_id?: string;
          value?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_option_values_option_id_fkey';
            columns: ['option_id'];
            referencedRelation: 'product_options';
            referencedColumns: ['id'];
          },
        ];
      };
      product_options: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variant_options: {
        Row: {
          id: string;
          variant_id: string;
          option_value_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          option_value_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          option_value_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variant_options_variant_id_fkey';
            columns: ['variant_id'];
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variant_options_option_value_id_fkey';
            columns: ['option_value_id'];
            referencedRelation: 'product_option_values';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          retail_price: number | null;
          business_price: number | null;
          stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku?: string | null;
          retail_price?: number | null;
          business_price?: number | null;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string | null;
          retail_price?: number | null;
          business_price?: number | null;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          retail_price: number;
          business_price: number | null;
          stock: number;
          sku: string | null;
          image_url: string | null;
          is_active: boolean;
          featured: boolean;
          has_variants: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          retail_price: number;
          business_price?: number | null;
          stock?: number;
          sku?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          featured?: boolean;
          has_variants?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          retail_price?: number;
          business_price?: number | null;
          stock?: number;
          sku?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          featured?: boolean;
          has_variants?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_updated_by_fkey';
            columns: ['updated_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      product_with_categories: {
        Row: {
          id: string | null;
          name: string | null;
          slug: string | null;
          description: string | null;
          retail_price: number | null;
          stock: number | null;
          business_price: number | null;
          is_active: boolean | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string | null;
          featured: boolean | null;
          sku: string | null;
          image_url: string | null;
          category_id: string | null;
          category_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_updated_by_fkey';
            columns: ['updated_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      add_to_cart: {
        Args: {
          p_cart_id: string;
          p_price: number;
          p_product_id: string;
          p_quantity: number;
          p_variant_id: string | null;
        };
        Returns: string; // Returns the cart item ID
      };
      debug_cart: {
        Args: {
          p_cart_id: string;
        };
        Returns: {
          cart_id: string;
          cart_exists: boolean;
          user_id: string | null;
          anonymous_id: string | null;
          status: string;
          item_count: number;
        }[];
      };
      force_delete_cart_item: {
        Args: {
          p_item_id: string;
        };
        Returns: boolean;
      };
      remove_cart_item: {
        Args: {
          p_item_id: string;
        };
        Returns: boolean;
      };
      remove_cart_item_fixed: {
        Args: {
          p_item_id: string;
        };
        Returns: boolean;
      };
      update_cart_item: {
        Args: {
          p_item_id: string;
          p_quantity: number;
        };
        Returns: boolean;
      };
      update_hero_banner_positions: {
        Args: {
          banner_ids: string[];
        };
        Returns: void;
      };
      list_cart_items: {
        Args: {
          p_cart_id: string;
        };
        Returns: {
          item_id: string;
          product_id: string;
          quantity: number;
          price: number;
          variant_id: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      checkout_step: CheckoutStep;
      order_status: OrderStatus;
      payment_method_type: PaymentMethodType;
      payment_status: PaymentStatus;
      user_role: UserRole;
    };
  };
}
