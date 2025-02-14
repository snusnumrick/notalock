import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  console.log('Delete image');
  try {
    if (request.method !== 'DELETE') {
      throw json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { response } = await requireAdmin(request);

    const imageId = params.imageId;
    if (!imageId) {
      throw json({ error: 'Image ID is required' }, { status: 400 });
    }

    return new Response(null, {
      status: 204,
      headers: response.headers,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Delete image error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};
