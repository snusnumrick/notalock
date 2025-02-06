import { json } from '@remix-run/node';
import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { AppError } from './error.server';

type HandlerFunction = LoaderFunction | ActionFunction;

export function withErrorHandler(handler: HandlerFunction): HandlerFunction {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return json(
          {
            error: {
              message: error.message,
              ...error.data,
            },
          },
          { status: error.statusCode }
        );
      }

      console.error('Unhandled error:', error);
      return json({ error: { message: 'An unexpected error occurred' } }, { status: 500 });
    }
  };
}
