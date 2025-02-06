import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { AppError } from '~/server/middleware/error.server';

type RemixRouteFunction = (args: LoaderFunctionArgs | ActionFunctionArgs) => Promise<Response>;

export function wrapRemixRoute(routeFn: RemixRouteFunction): RemixRouteFunction {
  return async args => {
    try {
      return await routeFn(args);
    } catch (error) {
      console.error('Route error:', error);

      // Don't wrap redirect responses
      if (error instanceof Response) {
        throw error;
      }

      if (error instanceof AppError) {
        return json({ error: error.message, details: error.details }, { status: error.status });
      }

      if (error instanceof Error) {
        return json({ error: error.message }, { status: 500 });
      }

      return json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
  };
}
