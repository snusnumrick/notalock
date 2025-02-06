import { parseMultipartFormData, writeAsyncIterableToWritable } from '@remix-run/node';
import sharp from 'sharp';
import { PassThrough } from 'stream';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

interface ProcessedImage {
  buffer: Buffer;
  format: string;
  contentType: string;
}

/**
 * Handles file upload from multipart form data
 */
async function uploadHandler({ data }: { data: AsyncIterable<Uint8Array> }) {
  const chunks: Buffer[] = [];
  const stream = new PassThrough();

  await writeAsyncIterableToWritable(data, stream);

  await new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  return Buffer.concat(chunks);
}

/**
 * Optimizes an image buffer using Sharp
 */
async function optimizeImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<Buffer> {
  const { maxWidth = 2000, maxHeight = 2000, quality = 85, format = 'webp' } = options;

  let pipeline = sharp(buffer);

  // Get image metadata
  const metadata = await pipeline.metadata();

  // Only resize if image is larger than max dimensions
  if (
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight)
  ) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert format and set quality
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'png':
      pipeline = pipeline.png({ quality });
      break;
    case 'webp':
    default:
      pipeline = pipeline.webp({ quality });
      break;
  }

  return pipeline.toBuffer();
}

/**
 * Processes an image from a request with optimization options
 */
export async function processImage(
  request: Request,
  options?: ImageProcessingOptions
): Promise<ProcessedImage> {
  if (request.method !== 'POST') {
    throw new Response('Method not allowed', { status: 405 });
  }

  const formData = await parseMultipartFormData(request, uploadHandler);
  const file = formData.get('file');

  if (!file || !(file instanceof Buffer)) {
    throw new Response('No file provided', { status: 400 });
  }

  // Parse options from form data if not provided
  const processOptions: ImageProcessingOptions = options || {
    maxWidth: parseNumericParam(formData.get('maxWidth')),
    maxHeight: parseNumericParam(formData.get('maxHeight')),
    quality: parseNumericParam(formData.get('quality')),
    format: formData.get('format') as ImageProcessingOptions['format'],
  };

  const buffer = await optimizeImage(file, processOptions);
  const format = processOptions.format || 'webp';

  // Determine content type
  const contentType =
    {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    }[format] || 'image/webp';

  return { buffer, format, contentType };
}

/**
 * Helper to parse numeric parameters from form data
 */
function parseNumericParam(value: FormDataEntryValue | null): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}
