export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  position: number;
  isActive: boolean;
  sortOrder: number;
  isVisible: boolean;
  status: string;
  isHighlighted: boolean;
  highlightPriority: number;
  children?: Category[];
  path?: string; // Full path for nested categories, used in breadcrumbs
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  sortOrder: number;
  isVisible: boolean;
  isHighlighted: boolean;
  highlightPriority: number;
}
