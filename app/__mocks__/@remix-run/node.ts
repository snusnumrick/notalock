type JsonResponseInit = Omit<ResponseInit, 'headers'> & {
  headers?: HeadersInit;
};

export function json<T>(data: T, init?: JsonResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

export const redirect = jest.fn();
export const createCookieSessionStorage = jest.fn();
export const unstable_parseMultipartFormData = jest.fn();
export const writeAsyncIterableToWritable = jest.fn();
