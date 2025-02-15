export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_visible: boolean;
  is_highlighted: boolean;
  highlight_priority: number;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
  children?: Category[];
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string | null;
  sort_order: number;
  is_visible: boolean;
  is_highlighted: boolean;
  highlight_priority: number;
}
