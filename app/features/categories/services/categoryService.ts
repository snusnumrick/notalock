import { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import type { Category, CategoryFormData } from '../types/category.types';

export class CategoryService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly session: Session
  ) {}

  async fetchCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async createCategory(formData: CategoryFormData): Promise<Category> {
    const slug = formData.slug || this.generateSlug(formData.name);
    const categoryData = {
      ...formData,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: this.session.user.id,
    };

    const { data, error } = await this.supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateCategory(id: string, formData: Partial<CategoryFormData>): Promise<Category> {
    const updateData = {
      ...formData,
      updated_at: new Date().toISOString(),
      updated_by: this.session.user.id,
    };

    if (formData.name) {
      updateData.slug = this.generateSlug(formData.name);
    }

    const { data, error } = await this.supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('created_by', this.session.user.id); // RLS policy check

    if (error) {
      throw error;
    }
  }

  async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
    const { error } = await this.supabase.from('categories').upsert(
      updates.map(({ id, position }) => ({
        id,
        sort_order: position,
        updated_at: new Date().toISOString(),
        updated_by: this.session.user.id,
      }))
    );

    if (error) {
      throw error;
    }
  }

  async updateHighlightStatus(categoryIds: string[], highlight: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .update({
        is_highlighted: highlight,
        updated_at: new Date().toISOString(),
        updated_by: this.session.user.id,
      })
      .in('id', categoryIds);

    if (error) {
      throw error;
    }
  }

  async updateHighlightPriority(categoryId: string, priority: number): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .update({
        highlight_priority: priority,
        updated_at: new Date().toISOString(),
        updated_by: this.session.user.id,
      })
      .eq('id', categoryId);

    if (error) {
      throw error;
    }
  }

  async fetchCategoryTree(): Promise<Category[]> {
    const categories = await this.fetchCategories();
    return this.buildCategoryTree(categories);
  }

  private buildCategoryTree(categories: Category[], parentId: string | null = null): Category[] {
    return categories
      .filter(category => category.parent_id === parentId)
      .map(category => ({
        ...category,
        children: this.buildCategoryTree(categories, category.id),
      }));
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
