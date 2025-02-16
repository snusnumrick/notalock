export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sort_order: number;
  is_visible: boolean;
  status: string;
  is_highlighted: boolean;
  highlight_priority: number;
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
