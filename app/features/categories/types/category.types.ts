export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  is_visible?: boolean;
}

export interface CategoryTreeItem extends Category {
  children: CategoryTreeItem[];
}
