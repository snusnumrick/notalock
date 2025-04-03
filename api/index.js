// api/index.js - Vercel serverless function
import path from 'path';
import { createRequestHandler, broadcastDevReady } from '@remix-run/node';
import * as build from '@remix-run/dev/server-build';

const BUILD_DIR = path.join(process.cwd(), 'build');

// This is used by Vercel for its serverless function
export default async function handler(request) {
  let reqHandler = createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
  });

  // Only call broadcastDevReady in development
  if (process.env.NODE_ENV === 'development') {
    try {
      await broadcastDevReady(build);
    } catch (error) {
      console.error('Error broadcasting dev ready', error);
    }
  }

  return reqHandler(request);
}
