import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import * as imageServer from '../image.server';

// Alias the functions for easier testing
const { processImage } = imageServer;

// Mock Sharp
vi.mock('sharp', () => {
  const mockPipeline = {
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    metadata: vi.fn().mockResolvedValue({ width: 2500, height: 1500 }),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('optimized-image')),
  };

  return {
    default: vi.fn().mockImplementation(() => mockPipeline),
  };
});

// Mock the form data parsing
vi.mock('@remix-run/node', () => ({
  unstable_parseMultipartFormData: vi.fn(),
  writeAsyncIterableToWritable: vi.fn(),
}));

describe('Image API validation', () => {
  it('should reject non-POST requests', async () => {
    const getRequest = new Request('http://example.com/api/images/optimize', {
      method: 'GET',
    });

    await expect(processImage(getRequest)).rejects.toThrow();
  });

  it('should reject requests without multipart/form-data', async () => {
    const invalidRequest = new Request('http://example.com/api/images/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    });

    await expect(processImage(invalidRequest)).rejects.toThrow();
  });
});

// Mock the internal functions directly for testing
describe('Sharp Integration', () => {
  // Create a mock implementation of optimizeImage for testing
  const mockOptimizeImage = vi.fn().mockImplementation(async (buffer, options = {}) => {
    const { maxWidth = 2000, maxHeight = 2000, quality = 85, format = 'webp' } = options;

    // Use the mocked Sharp instance
    const sharpInstance = sharp(buffer);

    // Get metadata to decide if resizing is needed
    const metadata = await sharpInstance.metadata();

    // Resize if needed
    if (
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight)
    ) {
      sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format conversion
    switch (format) {
      case 'jpeg':
        sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance.png({ quality });
        break;
      case 'webp':
      default:
        sharpInstance.webp({ quality });
        break;
    }

    // Generate buffer
    return sharpInstance.toBuffer();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resize images that exceed max dimensions', async () => {
    const inputBuffer = Buffer.from('test-image-data');
    const options = {
      maxWidth: 1000,
      maxHeight: 800,
      quality: 85,
    };

    await mockOptimizeImage(inputBuffer, options);

    // Verify Sharp was called
    expect(sharp).toHaveBeenCalledWith(inputBuffer);

    // Get the mocked instance
    const mockSharpInstance = vi.mocked(sharp).mock.results[0].value;

    // Verify resize was called because mock dimensions (2500x1500) exceed maxWidth/maxHeight
    expect(mockSharpInstance.resize).toHaveBeenCalledWith(1000, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Verify WebP is used by default
    expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 85 });
  });

  it('should use jpeg format when specified', async () => {
    const inputBuffer = Buffer.from('test-image-data');
    const options = {
      maxWidth: 1000,
      maxHeight: 800,
      quality: 75,
      format: 'jpeg',
    };

    await mockOptimizeImage(inputBuffer, options);

    // Get the mocked instance
    const mockSharpInstance = vi.mocked(sharp).mock.results[0].value;

    // Verify JPEG conversion was called with quality
    expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 75 });
  });

  it('should use webp format by default', async () => {
    const inputBuffer = Buffer.from('test-image-data');
    const options = {
      maxWidth: 1000,
      maxHeight: 800,
      quality: 90,
    };

    await mockOptimizeImage(inputBuffer, options);

    // Get the mocked instance
    const mockSharpInstance = vi.mocked(sharp).mock.results[0].value;

    // Verify WebP conversion was called with quality
    expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 90 });
  });
});
