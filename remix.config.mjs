/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ['**/.*', '**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
  serverModuleFormat: 'cjs',
  serverPlatform: 'node',
  tailwind: true,
  postcss: true,
  future: {
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_fetcherPersist: true,
    v3_lazyRouteDiscovery: true,
    v3_singleFetch: true,
  },
  sourcemap: process.env.NODE_ENV !== 'production',
};
