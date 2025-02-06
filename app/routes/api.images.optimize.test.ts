import { action, loader } from './api.images.optimize';

describe('Image Optimization API', () => {
  describe('loader', () => {
    it('returns healthy status', async () => {
      const response = await loader();
      const data = await response.json();
      expect(data).toEqual({ status: 'healthy' });
    });
  });

  describe('action', () => {
    it('returns 405 for non-POST requests', async () => {
      const request = new Request('http://localhost/api/images/optimize', {
        method: 'GET',
      });
      const response = await action({ request, params: {}, context: {} });
      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data).toEqual({ error: 'Method not allowed' });
    });

    it('returns 400 when no file is provided', async () => {
      const formData = new FormData();
      const request = new Request('http://localhost/api/images/optimize', {
        method: 'POST',
        body: formData,
      });
      const response = await action({ request, params: {}, context: {} });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'No file provided' });
    });
  });
});
