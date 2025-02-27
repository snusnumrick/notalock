import { redirect } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { getHeroBannerService } from './heroBannerService.server';
import { requireAdmin } from '~/server/middleware/auth.server';

const heroBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional().nullable(),
  image_url: z.string().min(1, 'Image URL is required'),
  cta_text: z.string().optional().nullable(),
  cta_link: z.string().optional().nullable(),
  secondary_cta_text: z.string().optional().nullable(),
  secondary_cta_link: z.string().optional().nullable(),
  is_active: z.enum(['true', 'false']).transform(val => val === 'true'),
  position: z.coerce.number().min(0),
  background_color: z.string().optional().nullable(),
  text_color: z.string().optional().nullable(),
});

export async function createBannerAction({ request }: ActionFunctionArgs) {
  try {
    // Check if user is admin
    const { user, response } = await requireAdmin(request);

    const formData = await request.formData();

    const parsed = heroBannerSchema.parse(Object.fromEntries(formData));
    const heroBannerService = getHeroBannerService(request, response);

    await heroBannerService.createHeroBanner({
      ...parsed,
      created_by: user.id,
    });

    return redirect('/admin/hero-banners');
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let redirect responses pass through
    }

    if (error instanceof z.ZodError) {
      return {
        error: 'Validation failed',
        errors: error.flatten().fieldErrors,
      };
    }

    console.error('Error creating banner:', error);
    return { error: 'Failed to create banner' };
  }
}

export async function updateBannerAction({ request, params }: ActionFunctionArgs) {
  try {
    // Check if user is admin
    const { response } = await requireAdmin(request);

    const formData = await request.formData();
    const bannerId = params.id;

    if (!bannerId) {
      return { error: 'Banner ID is required' };
    }

    const parsed = heroBannerSchema.parse(Object.fromEntries(formData));
    const heroBannerService = getHeroBannerService(request, response);

    await heroBannerService.updateHeroBanner(bannerId, parsed);

    return redirect('/admin/hero-banners');
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let redirect responses pass through
    }

    if (error instanceof z.ZodError) {
      return {
        error: 'Validation failed',
        errors: error.flatten().fieldErrors,
      };
    }

    console.error('Error updating banner:', error);
    return { error: 'Failed to update banner' };
  }
}

export async function deleteBannerAction({ request }: ActionFunctionArgs) {
  try {
    // Check if user is admin
    const { response } = await requireAdmin(request);

    const formData = await request.formData();
    const bannerId = formData.get('id') as string;

    if (!bannerId) {
      return { error: 'Banner ID is required' };
    }

    const heroBannerService = getHeroBannerService(request, response);
    await heroBannerService.deleteHeroBanner(bannerId);

    return { success: true };
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let redirect responses pass through
    }

    console.error('Error deleting banner:', error);
    return { error: 'Failed to delete banner' };
  }
}

export async function reorderBannerAction({ request }: ActionFunctionArgs) {
  try {
    // Check if user is admin
    const { response } = await requireAdmin(request);

    const formData = await request.formData();
    const bannerId = formData.get('id') as string;
    const position = formData.get('position');

    if (!bannerId || position === null) {
      return { error: 'Banner ID and position are required' };
    }

    const heroBannerService = getHeroBannerService(request, response);

    await heroBannerService.updateHeroBanner(bannerId, {
      position: Number(position),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let redirect responses pass through
    }

    console.error('Error reordering banner:', error);
    return { error: 'Failed to reorder banner' };
  }
}

export async function adminBannerAction({ request, params, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('_action') as string;

  switch (action) {
    case 'create':
      return createBannerAction({ request, params, context });
    case 'update':
      return updateBannerAction({ request, params, context });
    case 'delete':
      return deleteBannerAction({ request, params, context });
    case 'reorder':
      return reorderBannerAction({ request, params, context });
    default:
      return { error: 'Invalid action' };
  }
}
