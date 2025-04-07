export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          created_at: string;
          details: Json | null;
          id: string;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      admin_permissions: {
        Row: {
          can_manage_all_products: boolean;
          can_manage_categories: boolean;
          can_manage_orders: boolean;
          can_manage_products: boolean;
          can_manage_users: boolean;
          can_view_categories: boolean;
          can_view_orders: boolean;
          can_view_products: boolean;
          can_view_users: boolean;
          created_at: string;
          id: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          can_manage_all_products?: boolean;
          can_manage_categories?: boolean;
          can_manage_orders?: boolean;
          can_manage_products?: boolean;
          can_manage_users?: boolean;
          can_view_categories?: boolean;
          can_view_orders?: boolean;
          can_view_products?: boolean;
          can_view_users?: boolean;
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          can_manage_all_products?: boolean;
          can_manage_categories?: boolean;
          can_manage_orders?: boolean;
          can_manage_products?: boolean;
          can_manage_users?: boolean;
          can_view_categories?: boolean;
          can_view_orders?: boolean;
          can_view_products?: boolean;
          can_view_users?: boolean;
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string | null;
          id: string;
          price: number;
          product_id: string;
          quantity: number;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          cart_id: string;
          created_at?: string | null;
          id?: string;
          price: number;
          product_id: string;
          quantity: number;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          cart_id?: string;
          created_at?: string | null;
          id?: string;
          price?: number;
          product_id?: string;
          quantity?: number;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_with_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      carts: {
        Row: {
          anonymous_id: string | null;
          created_at: string | null;
          id: string;
          status: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          anonymous_id?: string | null;
          created_at?: string | null;
          id?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          anonymous_id?: string | null;
          created_at?: string | null;
          id?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          highlight_priority: number | null;
          id: string;
          is_active: boolean;
          is_highlighted: boolean | null;
          is_visible: boolean;
          name: string;
          parent_id: string | null;
          position: number;
          slug: string;
          sort_order: number;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          highlight_priority?: number | null;
          id?: string;
          is_active?: boolean;
          is_highlighted?: boolean | null;
          is_visible?: boolean;
          name: string;
          parent_id?: string | null;
          position?: number;
          slug: string;
          sort_order?: number;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          highlight_priority?: number | null;
          id?: string;
          is_active?: boolean;
          is_highlighted?: boolean | null;
          is_visible?: boolean;
          name?: string;
          parent_id?: string | null;
          position?: number;
          slug?: string;
          sort_order?: number;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'product_with_categories';
            referencedColumns: ['category_id'];
          },
        ];
      };
      checkout_sessions: {
        Row: {
          billing_address: Json | null;
          cart_id: string;
          created_at: string | null;
          current_step: string;
          guest_email: string | null;
          id: string;
          payment_info: Json | null;
          payment_method: string | null;
          shipping_address: Json | null;
          shipping_cost: number;
          shipping_method: string | null;
          shipping_option: Json | null;
          subtotal: number;
          tax: number;
          total: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          billing_address?: Json | null;
          cart_id: string;
          created_at?: string | null;
          current_step?: string;
          guest_email?: string | null;
          id?: string;
          payment_info?: Json | null;
          payment_method?: string | null;
          shipping_address?: Json | null;
          shipping_cost?: number;
          shipping_method?: string | null;
          shipping_option?: Json | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          billing_address?: Json | null;
          cart_id?: string;
          created_at?: string | null;
          current_step?: string;
          guest_email?: string | null;
          id?: string;
          payment_info?: Json | null;
          payment_method?: string | null;
          shipping_address?: Json | null;
          shipping_cost?: number;
          shipping_method?: string | null;
          shipping_option?: Json | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'checkout_sessions_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
        ];
      };
      hero_banners: {
        Row: {
          background_color: string | null;
          created_at: string | null;
          created_by: string | null;
          cta_link: string | null;
          cta_text: string | null;
          id: string;
          image_url: string;
          is_active: boolean;
          position: number;
          secondary_cta_link: string | null;
          secondary_cta_text: string | null;
          subtitle: string | null;
          text_color: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          background_color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          cta_link?: string | null;
          cta_text?: string | null;
          id?: string;
          image_url: string;
          is_active?: boolean;
          position?: number;
          secondary_cta_link?: string | null;
          secondary_cta_text?: string | null;
          subtitle?: string | null;
          text_color?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          background_color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          cta_link?: string | null;
          cta_text?: string | null;
          id?: string;
          image_url?: string;
          is_active?: boolean;
          position?: number;
          secondary_cta_link?: string | null;
          secondary_cta_text?: string | null;
          subtitle?: string | null;
          text_color?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string | null;
          id: string;
          image_url: string | null;
          name: string;
          options: Json | null;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
          sku: string;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          options?: Json | null;
          order_id: string;
          price: number;
          product_id: string;
          quantity: number;
          sku: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          options?: Json | null;
          order_id?: string;
          price?: number;
          product_id?: string;
          quantity?: number;
          sku?: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_with_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      order_status_history: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          order_id: string;
          status: Database['public']['Enums']['order_status'];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          order_id: string;
          status: Database['public']['Enums']['order_status'];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string;
          status?: Database['public']['Enums']['order_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'order_status_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          billing_address: Json;
          cart_id: string | null;
          checkout_session_id: string | null;
          created_at: string | null;
          guest_email: string | null;
          id: string;
          notes: string | null;
          order_number: string;
          payment_intent_id: string | null;
          payment_method: string;
          payment_method_id: string | null;
          payment_provider: string | null;
          payment_status: string;
          shipping_address: Json;
          shipping_cost: number;
          shipping_method: string;
          status: string;
          subtotal: number;
          tax: number;
          total: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          billing_address: Json;
          cart_id?: string | null;
          checkout_session_id?: string | null;
          created_at?: string | null;
          guest_email?: string | null;
          id?: string;
          notes?: string | null;
          order_number: string;
          payment_intent_id?: string | null;
          payment_method: string;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          payment_status?: string;
          shipping_address: Json;
          shipping_cost?: number;
          shipping_method: string;
          status?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          billing_address?: Json;
          cart_id?: string | null;
          checkout_session_id?: string | null;
          created_at?: string | null;
          guest_email?: string | null;
          id?: string;
          notes?: string | null;
          order_number?: string;
          payment_intent_id?: string | null;
          payment_method?: string;
          payment_method_id?: string | null;
          payment_provider?: string | null;
          payment_status?: string;
          shipping_address?: Json;
          shipping_cost?: number;
          shipping_method?: string;
          status?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_checkout_session_id_fkey';
            columns: ['checkout_session_id'];
            isOneToOne: false;
            referencedRelation: 'checkout_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: {
          category_id: string;
          created_at: string | null;
          product_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          product_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'product_with_categories';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'product_categories_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_with_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string | null;
          file_name: string;
          id: string;
          is_primary: boolean | null;
          product_id: string | null;
          sort_order: number | null;
          storage_path: string;
          updated_at: string | null;
          updated_by: string | null;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string | null;
          file_name: string;
          id?: string;
          is_primary?: boolean | null;
          product_id?: string | null;
          sort_order?: number | null;
          storage_path: string;
          updated_at?: string | null;
          updated_by?: string | null;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string | null;
          file_name?: string;
          id?: string;
          is_primary?: boolean | null;
          product_id?: string | null;
          sort_order?: number | null;
          storage_path?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_with_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images_backup: {
        Row: {
          created_at: string | null;
          id: string | null;
          is_primary: boolean | null;
          product_id: string | null;
          sort_order: number | null;
          updated_at: string | null;
          url: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string | null;
          is_primary?: boolean | null;
          product_id?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
          url?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          is_primary?: boolean | null;
          product_id?: string | null;
          sort_order?: number | null;
          updated_at?: string | null;
          url?: string | null;
        };
        Relationships: [];
      };
      product_option_values: {
        Row: {
          created_at: string | null;
          id: string;
          option_id: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          option_id: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          option_id?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_option_values_option_id_fkey';
            columns: ['option_id'];
            isOneToOne: false;
            referencedRelation: 'product_options';
            referencedColumns: ['id'];
          },
        ];
      };
      product_options: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_variant_options: {
        Row: {
          created_at: string | null;
          id: string;
          option_value_id: string;
          variant_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          option_value_id: string;
          variant_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          option_value_id?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variant_options_option_value_id_fkey';
            columns: ['option_value_id'];
            isOneToOne: false;
            referencedRelation: 'product_option_values';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variant_options_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          business_price: number | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          product_id: string;
          retail_price: number | null;
          sku: string | null;
          stock: number | null;
          updated_at: string | null;
        };
        Insert: {
          business_price?: number | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id: string;
          retail_price?: number | null;
          sku?: string | null;
          stock?: number | null;
          updated_at?: string | null;
        };
        Update: {
          business_price?: number | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id?: string;
          retail_price?: number | null;
          sku?: string | null;
          stock?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product_with_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          business_price: number | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          featured: boolean | null;
          has_variants: boolean;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          retail_price: number;
          sku: string | null;
          slug: string;
          stock: number;
          updated_by: string | null;
        };
        Insert: {
          business_price?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          featured?: boolean | null;
          has_variants?: boolean;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          retail_price: number;
          sku?: string | null;
          slug: string;
          stock?: number;
          updated_by?: string | null;
        };
        Update: {
          business_price?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          featured?: boolean | null;
          has_variants?: boolean;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          retail_price?: number;
          sku?: string | null;
          slug?: string;
          stock?: number;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          family_id: string | null;
          id: string;
          role: Database['public']['Enums']['user_role'] | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          family_id?: string | null;
          id: string;
          role?: Database['public']['Enums']['user_role'] | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          family_id?: string | null;
          id?: string;
          role?: Database['public']['Enums']['user_role'] | null;
        };
        Relationships: [];
      };
    };
    Views: {
      product_with_categories: {
        Row: {
          business_price: number | null;
          category_id: string | null;
          category_name: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          featured: boolean | null;
          id: string | null;
          image_url: string | null;
          is_active: boolean | null;
          name: string | null;
          retail_price: number | null;
          sku: string | null;
          stock: number | null;
          updated_by: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_to_cart: {
        Args: {
          p_cart_id: string;
          p_price: number;
          p_product_id: string;
          p_quantity: number;
          p_variant_id: string;
        };
        Returns: string;
      };
      adjust_business_prices: {
        Args: {
          product_ids: string[];
          adjustment: number;
        };
        Returns: undefined;
      };
      adjust_retail_prices: {
        Args: {
          product_ids: string[];
          adjustment: number;
        };
        Returns: undefined;
      };
      adjust_stock: {
        Args: {
          product_ids: string[];
          adjustment: number;
        };
        Returns: undefined;
      };
      check_duplicate_checkout_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: {
          cart_id: string;
          session_count: number;
        }[];
      };
      count_successful_student_payments: {
        Args: {
          p_student_id: string;
        };
        Returns: number;
      };
      debug_cart: {
        Args: {
          p_cart_id: string;
        };
        Returns: {
          cart_id: string;
          cart_exists: boolean;
          user_id: string;
          anonymous_id: string;
          status: string;
          item_count: number;
        }[];
      };
      debug_cart_rls: {
        Args: {
          cart_id: string;
          user_id: string;
          anonymous_id: string;
        };
        Returns: {
          check_result: boolean;
          cart_exists: boolean;
          user_check: boolean;
          anonymous_check: boolean;
          cart_owner: string;
        }[];
      };
      fix_duplicate_checkout_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      force_delete_cart_item: {
        Args: {
          p_item_id: string;
        };
        Returns: boolean;
      };
      get_table_columns: {
        Args: {
          table_name: string;
        };
        Returns: {
          column_name: string;
          data_type: string;
        }[];
      };
      is_admin:
        | {
            Args: Record<PropertyKey, never>;
            Returns: boolean;
          }
        | {
            Args: {
              jwt: Json;
            };
            Returns: boolean;
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
          variant_id: string;
          created_at: string;
          updated_at: string;
        }[];
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
      test_cart_rls: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      test_is_admin: {
        Args: {
          user_id: string;
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
        Returns: undefined;
      };
      update_order_status: {
        Args: {
          order_id: string;
          new_status: string;
          updated_timestamp: string;
        };
        Returns: undefined;
      };
      update_order_status_simple: {
        Args: {
          order_id: string;
          new_status: string;
          updated_timestamp: string;
        };
        Returns: boolean;
      };
      verify_cart_rls: {
        Args: Record<PropertyKey, never>;
        Returns: {
          test_name: string;
          result: boolean;
        }[];
      };
      verify_checkout_rls: {
        Args: Record<PropertyKey, never>;
        Returns: {
          test_name: string;
          result: boolean;
        }[];
      };
    };
    Enums: {
      belt_rank_enum:
        | 'white'
        | 'yellow'
        | 'orange'
        | 'green'
        | 'blue'
        | 'purple'
        | 'red'
        | 'brown'
        | 'black';
      cart_status: 'active' | 'checkout' | 'completed' | 'abandoned' | 'cleared' | 'consolidated';
      checkout_step: 'information' | 'shipping' | 'payment' | 'review' | 'confirmation';
      order_status:
        | 'created'
        | 'processing'
        | 'completed'
        | 'cancelled'
        | 'refunded'
        | 'pending'
        | 'paid'
        | 'failed';
      payment_method_type: 'credit_card' | 'paypal' | 'bank_transfer' | 'square';
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'processing';
      payment_type_enum: 'monthly_group' | 'yearly_group' | 'one_on_one_session' | 'other';
      user_role: 'customer' | 'business' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
