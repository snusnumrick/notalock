import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeroBannerService } from '../heroBannerService.server';
import type { HeroBanner, HeroBannerFormData } from '../../types/hero-banner.types';

describe('HeroBannerService', () => {
  // Top-level mock data
  const mockBanner: HeroBanner = {
    id: '1',
    title: 'Test Banner',
    image_url: 'https://example.com/image.jpg',
    is_active: true,
    position: 0,
    created_at: '2025-02-20T00:00:00Z',
    updated_at: '2025-02-20T00:00:00Z',
  };

  const mockBanners: HeroBanner[] = [mockBanner];

  const newBanner: HeroBanner = {
    id: '2',
    title: 'New Banner',
    image_url: 'https://example.com/new-image.jpg',
    is_active: true,
    position: 1,
    created_at: '2025-02-20T00:00:00Z',
    updated_at: '2025-02-20T00:00:00Z',
  };

  const updatedBanner: HeroBanner = {
    ...mockBanner,
    title: 'Updated Banner',
  };

  // Helper function for creating mock builders
  const createSuccessBuilder = (returnData: any) => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
    data: returnData,
    error: null,
  });

  const createErrorBuilder = (errorMsg: string) => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: new Error(errorMsg) }),
    data: null,
    error: new Error(errorMsg),
  });

  let heroBannerService: HeroBannerService;
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create a fresh mock supabase client for each test
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };

    heroBannerService = new HeroBannerService(mockSupabase);
  });

  describe('fetchHeroBanners', () => {
    it('fetches all hero banners with default options', async () => {
      // Setup success builder
      const builder = createSuccessBuilder(mockBanners);
      mockSupabase.from.mockReturnValue(builder);

      const banners = await heroBannerService.fetchHeroBanners();

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.order).toHaveBeenCalledWith('position', { ascending: true });
      expect(banners).toEqual(mockBanners);
    });

    it('fetches only active hero banners when isActive is true', async () => {
      // Setup success builder
      const builder = createSuccessBuilder(mockBanners);
      mockSupabase.from.mockReturnValue(builder);

      await heroBannerService.fetchHeroBanners({ isActive: true });

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.order).toHaveBeenCalledWith('position', { ascending: true });
      expect(builder.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('handles errors properly when fetching banners', async () => {
      // Setup error builder
      const errorMsg = 'Failed to fetch banners';
      const builder = createErrorBuilder(errorMsg);
      mockSupabase.from.mockReturnValue(builder);

      await expect(heroBannerService.fetchHeroBanners()).rejects.toThrow(
        `Failed to fetch hero banners: ${errorMsg}`
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.select).toHaveBeenCalled();
    });
  });

  describe('fetchHeroBannerById', () => {
    it('fetches a specific hero banner by ID', async () => {
      // Setup success builder
      const builder = createSuccessBuilder(mockBanner);
      mockSupabase.from.mockReturnValue(builder);

      const banner = await heroBannerService.fetchHeroBannerById('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
      expect(banner).toEqual(mockBanner);
    });

    it('handles errors properly when fetching a banner by ID', async () => {
      // Setup error builder
      const errorMsg = 'Banner not found';
      const builder = createErrorBuilder(errorMsg);
      mockSupabase.from.mockReturnValue(builder);

      await expect(heroBannerService.fetchHeroBannerById('1')).rejects.toThrow(
        `Failed to fetch hero banner: ${errorMsg}`
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.select).toHaveBeenCalled();
    });
  });

  describe('createHeroBanner', () => {
    it('creates a new hero banner', async () => {
      const bannerData: HeroBannerFormData = {
        title: 'New Banner',
        image_url: 'https://example.com/new-image.jpg',
        is_active: true,
        position: 1,
      };

      // Setup insert builder
      const builder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newBanner, error: null }),
      };
      mockSupabase.from.mockReturnValue(builder);

      const createdBanner = await heroBannerService.createHeroBanner(bannerData);

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.insert).toHaveBeenCalledWith(bannerData);
      expect(builder.select).toHaveBeenCalled();
      expect(createdBanner).toEqual(newBanner);
    });

    it('handles errors when creating a banner', async () => {
      const bannerData: HeroBannerFormData = {
        title: 'New Banner',
        image_url: 'https://example.com/new-image.jpg',
        is_active: true,
        position: 1,
      };

      // Setup error builder
      const errorMsg = 'Error creating banner';
      const builder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error(errorMsg) }),
      };
      mockSupabase.from.mockReturnValue(builder);

      await expect(heroBannerService.createHeroBanner(bannerData)).rejects.toThrow(
        `Failed to create hero banner: ${errorMsg}`
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.insert).toHaveBeenCalledWith(bannerData);
    });
  });

  describe('updateHeroBanner', () => {
    it('updates an existing hero banner', async () => {
      const bannerData: Partial<HeroBannerFormData> = {
        title: 'Updated Banner',
      };

      // Setup update builder
      const builder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedBanner, error: null }),
      };
      mockSupabase.from.mockReturnValue(builder);

      const result = await heroBannerService.updateHeroBanner('1', bannerData);

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.update).toHaveBeenCalledWith(expect.objectContaining(bannerData));
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(updatedBanner);
    });

    it('handles errors when updating a banner', async () => {
      const bannerData: Partial<HeroBannerFormData> = {
        title: 'Updated Banner',
      };

      // Setup error builder
      const errorMsg = 'Error updating banner';
      const builder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error(errorMsg) }),
      };
      mockSupabase.from.mockReturnValue(builder);

      await expect(heroBannerService.updateHeroBanner('1', bannerData)).rejects.toThrow(
        `Failed to update hero banner: ${errorMsg}`
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.update).toHaveBeenCalled();
    });
  });

  describe('deleteHeroBanner', () => {
    it('deletes a hero banner', async () => {
      // Setup delete builder
      const builder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from.mockReturnValue(builder);

      await heroBannerService.deleteHeroBanner('1');

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', '1');
    });

    it('handles errors when deleting a banner', async () => {
      // Setup error builder
      const errorMsg = 'Error deleting banner';
      const builder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error(errorMsg) }),
      };
      mockSupabase.from.mockReturnValue(builder);

      await expect(heroBannerService.deleteHeroBanner('1')).rejects.toThrow(
        `Failed to delete hero banner: ${errorMsg}`
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('hero_banners');
      expect(builder.delete).toHaveBeenCalled();
    });
  });

  describe('reorderHeroBanners', () => {
    it('reorders hero banners', async () => {
      const orderedIds = ['2', '1'];

      // Setup RPC mock
      mockSupabase.rpc = vi.fn().mockResolvedValue({ error: null });

      await heroBannerService.reorderHeroBanners(orderedIds);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_hero_banner_positions', {
        banner_ids: orderedIds,
      });
    });

    it('handles errors when reordering banners', async () => {
      const orderedIds = ['2', '1'];
      const errorMsg = 'Error reordering banners';

      // Setup RPC error mock
      mockSupabase.rpc = vi.fn().mockResolvedValue({
        error: new Error(errorMsg),
      });

      await expect(heroBannerService.reorderHeroBanners(orderedIds)).rejects.toThrow(
        `Failed to reorder hero banners: ${errorMsg}`
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_hero_banner_positions', {
        banner_ids: orderedIds,
      });
    });
  });
});
