// Database schema definitions (tables, views, functions)
// JSON type definition
// These are the core type definitions for your database structure

// Add this export statement
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';
export type UserRole = 'customer' | 'business' | 'admin';

export interface Database {
  public: {
    Tables: {
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
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          status?: string;
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
    Functions: Record<string, never>;
    Enums: {
      order_status: OrderStatus;
      user_role: UserRole;
    };
  };
}
