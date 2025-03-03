// Define the database row type (snake_case)
interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  position?: number;
  is_active?: boolean;
  sort_order?: number;
  is_visible?: boolean;
  status?: string;
  is_highlighted?: boolean;
  highlight_priority?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  children?: DbCategory[];
}

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

    return data ? data.map(category => this.mapDbCategoryToModel(category)) : [];
  }

  async createCategory(formData: CategoryFormData): Promise<Category> {
    const slug = formData.slug || this.generateSlug(formData.name);
    const categoryData = {
      name: formData.name,
      slug: slug,
      description: formData.description,
      parent_id: formData.parentId, // Convert camelCase to snake_case for DB
      sort_order: formData.sortOrder, // Convert camelCase to snake_case for DB
      is_visible: formData.isVisible, // Convert camelCase to snake_case for DB
      is_highlighted: formData.isHighlighted, // Convert camelCase to snake_case for DB
      highlight_priority: formData.highlightPriority, // Convert camelCase to snake_case for DB
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

    return this.mapDbCategoryToModel(data);
  }

  async updateCategory(id: string, formData: Partial<CategoryFormData>): Promise<Category> {
    // Convert camelCase properties to snake_case for DB
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: this.session.user.id,
    };

    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.description !== undefined) updateData.description = formData.description;
    if (formData.parentId !== undefined) updateData.parent_id = formData.parentId;
    if (formData.sortOrder !== undefined) updateData.sort_order = formData.sortOrder;
    if (formData.isVisible !== undefined) updateData.is_visible = formData.isVisible;
    if (formData.isHighlighted !== undefined) updateData.is_highlighted = formData.isHighlighted;
    if (formData.highlightPriority !== undefined)
      updateData.highlight_priority = formData.highlightPriority;

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

    return this.mapDbCategoryToModel(data);
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
        sort_order: position, // Convert camelCase to snake_case for DB
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
        is_highlighted: highlight, // Use snake_case for DB field
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
        highlight_priority: priority, // Use snake_case for DB field
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
      .filter(category => category.parentId === parentId)
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

  // Convert DB snake_case to model camelCase
  private mapDbCategoryToModel(dbCategory: DbCategory): Category {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      slug: dbCategory.slug,
      description: dbCategory.description,
      parentId: dbCategory.parent_id,
      position: dbCategory.position ?? 0,
      isActive: dbCategory.is_active ?? false,
      sortOrder: dbCategory.sort_order ?? 0,
      isVisible: dbCategory.is_visible ?? false,
      status: dbCategory.status ?? '',
      isHighlighted: dbCategory.is_highlighted ?? false,
      highlightPriority: dbCategory.highlight_priority ?? 0,
      children: dbCategory.children
        ? dbCategory.children.map(child => this.mapDbCategoryToModel(child))
        : undefined,
    };
  }
}
