import type { ActionFunctionArgs } from '@remix-run/node';
import { json, parseMultipartFormData, writeAsyncIterableToWritable } from '@remix-run/node';
import sharp from 'sharp';
import { PassThrough } from 'stream';

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

function parseNumericParam(value: FormDataEntryValue | null): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

async function optimizeImage(buffer: Buffer, options: OptimizationOptions = {}): Promise<Buffer> {
  const { maxWidth = 2000, maxHeight = 2000, quality = 85, format = 'webp' } = options;

  let pipeline = sharp(buffer);

  // Resize if needed
  pipeline = pipeline.resize(maxWidth, maxHeight, {
    fit: 'inside',
    withoutEnlargement: true,
  });

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

export async function action({ request }: ActionFunctionArgs) {
  try {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const formData = await parseMultipartFormData(request, uploadHandler);

    const file = formData.get('file');
    if (!file || !(file instanceof Buffer)) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse optimization options from form data
    const options: OptimizationOptions = {
      maxWidth: parseNumericParam(formData.get('maxWidth')),
      maxHeight: parseNumericParam(formData.get('maxHeight')),
      quality: parseNumericParam(formData.get('quality')),
      format: formData.get('format') as OptimizationOptions['format'],
    };

    const optimizedBuffer = await optimizeImage(file, options);

    // Determine content type based on format
    let contentType: string;
    switch (options.format) {
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'webp':
      default:
        contentType = 'image/webp';
        break;
    }

    return new Response(optimizedBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    return json({ error: 'Failed to optimize image' }, { status: 500 });
  }
}

// Optional: Health check endpoint
export async function loader() {
  return json({ status: 'healthy' });
}
