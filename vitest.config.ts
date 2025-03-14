/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      // Only include files that explicitly match our test patterns
      'app/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.test.{js,jsx,ts,tsx}',
    ],
    exclude: [
      // Explicitly exclude any cache files
      '**/.cache/**',
      '.cache/**',
      // Exclude Playwright
      'playwright.config.ts',
      'tests/e2e/**',
      // Standard exclusions
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
    ],
    alias: {
      '~/': '/app/',
      '@/': '/app/',
    },
  },
});
