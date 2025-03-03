import type { Category, CategoryFormData } from '../types/category.types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CategoryNode extends Category {
  children: CategoryNode[];
}

// Define types for database fields with snake_case naming
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
  children?: DbCategory[];
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

    // Map database snake_case to application camelCase
    return data ? data.map(cat => this.mapDbToCategory(cat)) : [];
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

    // Map database snake_case to application camelCase
    return data ? data.map(cat => this.mapDbToCategory(cat)) : [];
  }

  async createCategory(data: CategoryFormData): Promise<Category> {
    const { data: category, error } = await this.client
      .from('categories')
      .insert({
        name: data.name,
        slug: data.slug || this.generateSlug(data.name),
        description: data.description,
        parent_id: data.parentId || null,
        sort_order: data.sortOrder || 0,
        is_visible: data.isVisible ?? true,
        is_highlighted: data.isHighlighted,
        highlight_priority: data.highlightPriority,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Create failed');
    }

    return this.mapDbToCategory(category);
  }

  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.isVisible !== undefined) updateData.is_visible = data.isVisible;
    if (data.isHighlighted !== undefined) updateData.is_highlighted = data.isHighlighted;
    if (data.highlightPriority !== undefined)
      updateData.highlight_priority = data.highlightPriority;

    if (data.name) {
      updateData.slug = this.generateSlug(data.name);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: category, error } = await this.client
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error('Update failed');
    }

    return this.mapDbToCategory(category);
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
      if (category.parentId && categoryMap.has(category.parentId)) {
        categoryMap.get(category.parentId)!.children.push(node);
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

  // Convert database snake_case to model camelCase
  private mapDbToCategory(dbCat: DbCategory): Category {
    return {
      id: dbCat.id,
      name: dbCat.name,
      slug: dbCat.slug,
      description: dbCat.description,
      parentId: dbCat.parent_id,
      position: dbCat.position ?? 0, // Provide default values for required fields
      isActive: dbCat.is_active ?? true,
      sortOrder: dbCat.sort_order ?? 0,
      isVisible: dbCat.is_visible ?? true,
      status: dbCat.status ?? '',
      isHighlighted: dbCat.is_highlighted ?? false,
      highlightPriority: dbCat.highlight_priority ?? 0,
      children: Array.isArray(dbCat.children)
        ? dbCat.children.map(c => this.mapDbToCategory(c))
        : undefined,
    };
  }
}

// Create and export a default instance
export const categoryService = CategoryService.instance;
