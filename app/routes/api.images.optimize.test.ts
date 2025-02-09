import { describe, it, expect, vi } from 'vitest';
import { action, loader } from './api.images.optimize';
import type { ActionFunctionArgs } from '@remix-run/node';
import { processImage } from '~/server/middleware/image.server';

vi.mock('~/server/middleware/image.server', () => ({
  processImage: vi.fn(),
}));

describe('Image Optimization API', () => {
  describe('loader', () => {
    it('returns healthy status', async () => {
      const request = new Request('http://localhost/api/images/optimize', {
        method: 'GET',
      });
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();
      expect(data).toEqual({ status: 'healthy' });
    });
  });

  describe('action', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('returns 405 for non-POST requests', async () => {
      const request = new Request('http://localhost/api/images/optimize', {
        method: 'GET',
      });
      const response = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data).toEqual({ error: 'Method not allowed' });
    });

    it('returns 400 when no file is provided', async () => {
      // Mock processImage to throw a Response with 400 status
      vi.mocked(processImage).mockRejectedValueOnce(
        new Response(JSON.stringify({ error: 'Invalid form data' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const request = new Request('http://localhost/api/images/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=boundary',
        },
      });

      const response = await action({ request, params: {}, context: {} } as ActionFunctionArgs);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Invalid form data' });
    });

    it('successfully processes an image', async () => {
      const mockBuffer = Buffer.from('processed image data');
      const mockContentType = 'image/webp';

      // Mock the processImage function
      vi.mocked(processImage).mockResolvedValueOnce({
        buffer: mockBuffer,
        contentType: mockContentType,
        format: 'webp',
      });

      // Create proper multipart form data
      const boundary = '---------------------------test-boundary';
      const formDataString = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.jpg"',
        'Content-Type: image/jpeg',
        '',
        'fake image data',
        `--${boundary}--`,
        '',
      ].join('\r\n');

      const request = new Request('http://localhost/api/images/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formDataString,
      });

      const response = await action({ request, params: {}, context: {} } as ActionFunctionArgs);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(mockContentType);
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');

      const responseBuffer = await response.arrayBuffer();
      expect(Buffer.from(responseBuffer)).toEqual(mockBuffer);
    });
  });
});
