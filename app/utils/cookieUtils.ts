export const getCookieBrowser = (key: string): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  return document.cookie
    .split('; ')
    .find(row => row.startsWith(`${key}=`))
    ?.split('=')?.[1];
};

export const setCookieBrowser = (
  key: string,
  value: string,
  options?: { maxAge?: number; path?: string }
) => {
  if (typeof document === 'undefined') {
    return;
  }

  let cookie = `${key}=${value}`;
  if (options?.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  if (options?.path) {
    cookie += `; path=${options.path}`;
  }
  document.cookie = cookie;
};

export const removeCookieBrowser = (key: string, options?: { path?: string }) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${key}=; Max-Age=0${options?.path ? `; path=${options.path}` : ''}`;
};
