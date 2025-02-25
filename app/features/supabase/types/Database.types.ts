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
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          retail_price: number;
          business_price: number;
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
          description?: string | null;
          retail_price: number;
          business_price: number;
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
          description?: string | null;
          retail_price?: number;
          business_price?: number;
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
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          business_number: string | null;
          shipping_address: Json | null;
          billing_address: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          company_name?: string | null;
          business_number?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          first_name?: string | null;
          last_name?: string | null;
          company_name?: string | null;
          business_number?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          created_at?: string;
          updated_at?: string;
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
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          status: OrderStatus;
          total_amount: number;
          shipping_address: Json;
          billing_address: Json;
          shipping_method: string | null;
          tracking_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          status?: OrderStatus;
          total_amount: number;
          shipping_address: Json;
          billing_address: Json;
          shipping_method?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          status?: OrderStatus;
          total_amount?: number;
          shipping_address?: Json;
          billing_address?: Json;
          shipping_method?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
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
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: OrderStatus;
      user_role: UserRole;
    };
  };
}
