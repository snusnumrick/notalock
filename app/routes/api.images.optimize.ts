import { json, type ActionFunctionArgs } from '@remix-run/node';
import { processImage } from '~/server/middleware';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    if (request.method !== 'POST') {
      throw json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { buffer, contentType } = await processImage(request);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Image optimization error:', error);
    throw json(
      {
        error: error instanceof Error ? error.message : 'Failed to optimize image',
      },
      { status: 500 }
    );
  }
};

// Optional: Health check endpoint
export const loader = async ({ request }: ActionFunctionArgs) => {
  try {
    if (request.method !== 'GET') {
      throw json({ error: 'Method not allowed' }, { status: 405 });
    }

    return json({ status: 'healthy' });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Health check error:', error);
    throw json({ error: 'Service unavailable' }, { status: 503 });
  }
};
