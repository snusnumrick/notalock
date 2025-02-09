import { SupabaseClient } from '@supabase/supabase-js';
import type { Category, CategoryFormData, CategoryTreeItem } from '../types/category.types';

export class CategoryService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async fetchCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.from('categories').select('*').order('sort_order');

    if (error) throw error;
    return data;
  }

  async fetchCategoryTree(): Promise<CategoryTreeItem[]> {
    const categories = await this.fetchCategories();
    return this.buildCategoryTree(categories);
  }

  async createCategory(data: CategoryFormData): Promise<Category> {
    const slug = data.slug || this.generateSlug(data.name);

    const { data: category, error } = await this.supabase
      .from('categories')
      .insert([{ ...data, slug }])
      .select()
      .single();

    if (error) throw error;
    return category;
  }

  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
    if (data.name && !data.slug) {
      data.slug = this.generateSlug(data.name);
    }

    const { data: category, error } = await this.supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.from('categories').delete().eq('id', id);

    if (error) throw error;
  }

  async updateSortOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
    const { error } = await this.supabase.from('categories').upsert(
      updates.map(({ id, sort_order }) => ({
        id,
        sort_order,
        updated_at: new Date().toISOString(),
      }))
    );

    if (error) throw error;
  }

  private buildCategoryTree(categories: Category[]): CategoryTreeItem[] {
    const categoryMap = new Map<string, CategoryTreeItem>();
    const roots: CategoryTreeItem[] = [];

    // Initialize all categories with empty children array
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build the tree structure
    categories.forEach(category => {
      const node = categoryMap.get(category.id)!;
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
