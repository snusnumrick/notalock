import { type ActionFunctionArgs } from '@remix-run/node';
import { processImage } from '~/server/middleware/image.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const { buffer, contentType } = await processImage(request);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    // If the error is a Response (like our 400 error), return it directly
    if (error instanceof Response) {
      return error;
    }

    // Otherwise, log and return 500
    console.error('Image optimization error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to optimize image',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const loader = async ({ request }: ActionFunctionArgs) => {
  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error('Health check error:', error);
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
