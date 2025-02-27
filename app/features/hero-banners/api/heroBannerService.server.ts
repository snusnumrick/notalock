import type { HeroBanner, HeroBannerFormData } from '../types/hero-banner.types';
import { createSupabaseClient } from '~/server/services/supabase.server';

export interface HeroBannerServiceOptions {
  isActive?: boolean;
}

export class HeroBannerService {
  constructor(private supabase: ReturnType<typeof createSupabaseClient>) {}

  async fetchHeroBanners(options: HeroBannerServiceOptions = {}): Promise<HeroBanner[]> {
    let query = this.supabase
      .from('hero_banners')
      .select('*')
      .order('position', { ascending: true });

    if (options.isActive !== undefined) {
      // console.log('Filtering by is_active:', options.isActive);
      query = query.eq('is_active', options.isActive);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching hero banners:', error);
      throw new Error(`Failed to fetch hero banners: ${error.message}`);
    }

    return data || [];
  }

  async fetchHeroBannerById(id: string): Promise<HeroBanner | null> {
    const { data, error } = await this.supabase
      .from('hero_banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching hero banner with id ${id}:`, error);
      throw new Error(`Failed to fetch hero banner: ${error.message}`);
    }

    return data;
  }

  async createHeroBanner(banner: HeroBannerFormData): Promise<HeroBanner> {
    const { data, error } = await this.supabase
      .from('hero_banners')
      .insert(banner)
      .select()
      .single();

    if (error) {
      console.error('Error creating hero banner:', error);
      throw new Error(`Failed to create hero banner: ${error.message}`);
    }

    return data;
  }

  async updateHeroBanner(id: string, banner: Partial<HeroBannerFormData>): Promise<HeroBanner> {
    const { data, error } = await this.supabase
      .from('hero_banners')
      .update({
        ...banner,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating hero banner with id ${id}:`, error);
      throw new Error(`Failed to update hero banner: ${error.message}`);
    }

    return data;
  }

  async deleteHeroBanner(id: string): Promise<void> {
    const { error } = await this.supabase.from('hero_banners').delete().eq('id', id);

    if (error) {
      console.error(`Error deleting hero banner with id ${id}:`, error);
      throw new Error(`Failed to delete hero banner: ${error.message}`);
    }
  }

  async reorderHeroBanners(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      id,
      position: index,
    }));

    const { error } = await this.supabase.from('hero_banners').upsert(updates);

    if (error) {
      console.error('Error reordering hero banners:', error);
      throw new Error(`Failed to reorder hero banners: ${error.message}`);
    }
  }
}

export function getHeroBannerService(request: Request, response: Response) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are not set');
  }

  const supabase = createSupabaseClient(request, response);

  return new HeroBannerService(supabase);
}
