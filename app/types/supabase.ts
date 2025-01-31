// app/types/supabase.ts

// Add this export statement
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            products: {
                Row: {
                    id: string;
                    created_at: string;
                    name: string;
                    description: string;
                    price: number;
                    category: string;
                    image_url: string;
                    stock: number;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    name: string;
                    description: string;
                    price: number;
                    category: string;
                    image_url: string;
                    stock: number;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    name?: string;
                    description?: string;
                    price?: number;
                    category?: string;
                    image_url?: string;
                    stock?: number;
                };
            };
            users: {
                Row: {
                    id: string;
                    created_at: string;
                    email: string;
                    role: 'customer' | 'business' | 'admin';
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    email: string;
                    role?: 'customer' | 'business' | 'admin';
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    email?: string;
                    role?: 'customer' | 'business' | 'admin';
                };
            };
            orders: {
                Row: {
                    id: string;
                    created_at: string;
                    user_id: string;
                    status: 'pending' | 'processing' | 'shipped' | 'delivered';
                    total: number;
                };
                Insert: {
                    id?: string;
                    created_at?: string;
                    user_id: string;
                    status?: 'pending' | 'processing' | 'shipped' | 'delivered';
                    total: number;
                };
                Update: {
                    id?: string;
                    created_at?: string;
                    user_id?: string;
                    status?: 'pending' | 'processing' | 'shipped' | 'delivered';
                    total?: number;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}