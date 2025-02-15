import type { Category, CategoryFormData } from '../types/category.types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CategoryNode extends Category {
  children: CategoryNode[];
}

export class CategoryService {
  static instance: CategoryService;

  static initialize(client: SupabaseClient): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService(client);
    }
    return CategoryService.instance;
  }

  constructor(private client: SupabaseClient) {}

  async fetchCategories(options?: {
    isHighlighted?: boolean;
    isVisible?: boolean;
  }): Promise<Category[]> {
    let query = this.client.from('categories').select('*').order('sort_order', { ascending: true });

    if (options?.isHighlighted) {
      query = query.eq('is_highlighted', true);
    }

    if (options?.isVisible) {
      query = query.eq('is_visible', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to load categories');
    }

    return data;
  }

  async fetchHighlightedCategories(): Promise<Category[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('is_highlighted', true)
      .order('highlight_priority', { ascending: false });

    if (error) {
      throw new Error('Failed to load highlighted categories');
    }

    return data;
  }

  async createCategory(data: CategoryFormData): Promise<Category> {
    const { data: category, error } = await this.client
      .from('categories')
      .insert({
        name: data.name,
        slug: data.slug || this.generateSlug(data.name),
        description: data.description,
        parent_id: data.parent_id || null,
        sort_order: data.sort_order || 0,
        is_visible: data.is_visible ?? true,
        is_highlighted: data.is_highlighted ?? false,
        highlight_priority: data.highlight_priority ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Create failed');
    }

    return category;
  }

  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
    const updateData = {
      ...data,
      slug: data.name ? this.generateSlug(data.name) : data.slug,
      parent_id: data.parent_id || null,
    };

    const { data: category, error } = await this.client
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Update failed');
    }

    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.client.from('categories').delete().eq('id', id);

    if (error) {
      throw new Error('Delete failed');
    }
  }

  async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
    const { error } = await this.client.from('categories').upsert(
      updates.map(update => ({
        id: update.id,
        sort_order: update.position,
        updated_at: new Date().toISOString(),
      }))
    );

    if (error) {
      throw new Error('Update positions failed');
    }
  }

  async updateHighlightStatus(categoryIds: string[], isHighlighted: boolean): Promise<void> {
    const { error } = await this.client
      .from('categories')
      .update({
        is_highlighted: isHighlighted,
        highlight_priority: isHighlighted ? 0 : null, // Reset priority when removing from highlights
        updated_at: new Date().toISOString(),
      })
      .in('id', categoryIds);

    if (error) {
      throw new Error('Failed to update highlight status');
    }
  }

  async updateHighlightPriority(categoryId: string, priority: number): Promise<void> {
    if (priority < 0) {
      throw new Error('Priority must be non-negative');
    }

    const { error } = await this.client
      .from('categories')
      .update({
        highlight_priority: priority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .eq('is_highlighted', true); // Only update if category is highlighted

    if (error) {
      throw new Error('Failed to update highlight priority');
    }
  }

  async fetchCategoryTree(): Promise<CategoryNode[]> {
    const categories = await this.fetchCategories();
    return this.buildCategoryTree(categories);
  }

  private buildCategoryTree(categories: Category[]): CategoryNode[] {
    const categoryMap = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // First pass: create nodes
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree
    categories.forEach(category => {
      const node = categoryMap.get(category.id)!;
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        categoryMap.get(category.parent_id)!.children.push(node);
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

// Create and export a default instance
export const categoryService = CategoryService.instance;
