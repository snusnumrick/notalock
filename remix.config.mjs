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
  browserNodeBuiltinsPolyfill: { modules: { crypto: true, events: true, buffer: true } },
  
  // Bundle ESM dependencies to avoid CommonJS/ESM conflicts
  serverDependenciesToBundle: [
    'react-dnd',
    'react-dnd-html5-backend',
    'dnd-core',
    'react-dropzone',
    '@react-dnd/invariant',
    '@react-dnd/asap',
    '@react-dnd/shallowequal'
  ],
};
