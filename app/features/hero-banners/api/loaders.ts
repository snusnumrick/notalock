import { json } from '@remix-run/node';
import { getHeroBannerService } from './heroBannerService.server';

export async function heroBannersLoader({
  request,
  response,
}: {
  request: Request;
  response: Response;
}) {
  try {
    console.log('heroBannersLoader: Fetching active banners');
    const heroBannerService = getHeroBannerService(request, response);
    const banners = await heroBannerService.fetchHeroBanners({ isActive: true });

    console.log('heroBannersLoader: Retrieved banners:', banners);
    return json({ banners });
  } catch (error) {
    console.error('Error in heroBannersLoader:', error);

    // Return an empty array of banners on error
    return json({ banners: [] });
  }
}
