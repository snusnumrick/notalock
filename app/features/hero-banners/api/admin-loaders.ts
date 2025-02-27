import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { getHeroBannerService } from './heroBannerService.server';
import { requireAdmin } from '~/server/middleware/auth.server';

export async function adminBannersLoader({ request }: LoaderFunctionArgs) {
  try {
    // Check if user is admin
    const { response } = await requireAdmin(request);

    const heroBannerService = getHeroBannerService(request, response);
    const banners = await heroBannerService.fetchHeroBanners();

    // Sort by position to ensure consistent order
    banners.sort((a, b) => a.position - b.position);

    return json({ banners });
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let redirect responses pass through
    }

    console.error('Error in adminBannersLoader:', error);
    return json({
      banners: [],
      error: 'Failed to load hero banners',
    });
  }
}

export async function adminBannerLoader({ request, params }: LoaderFunctionArgs) {
  try {
    // Check if user is admin
    const { response } = await requireAdmin(request);

    const bannerId = params.id;
    if (!bannerId) {
      throw redirect('/admin/hero-banners');
    }

    const heroBannerService = getHeroBannerService(request, response);
    const banner = await heroBannerService.fetchHeroBannerById(bannerId);

    if (!banner) {
      throw redirect('/admin/hero-banners');
    }

    return json({ banner });
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let redirect responses pass through
    }

    console.error(`Error in adminBannerLoader for id ${params.id}:`, error);
    throw redirect('/admin/hero-banners');
  }
}
