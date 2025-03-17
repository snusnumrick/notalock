import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { createRemixStub } from '~/__mocks__/remix';

// Ensure TextEncoder is properly polyfilled
if (typeof global.TextEncoder !== 'function') {
  global.TextEncoder = class TextEncoder {
    encoding: string = 'utf-8';

    encode(input: string): Uint8Array {
      const bytes = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        bytes[i] = input.charCodeAt(i);
      }
      return bytes;
    }

    encodeInto(input: string, dest: Uint8Array): { read: number; written: number } {
      const bytes = this.encode(input);
      const length = Math.min(dest.length, bytes.length);
      for (let i = 0; i < length; i++) {
        dest[i] = bytes[i];
      }
      return { read: input.length, written: length };
    }
  };
}

declare global {
  interface Window {
    fs?: {
      readFile: (
        path: string,
        options?: { encoding?: string | undefined } | undefined
      ) => Promise<string | Uint8Array>;
    };
  }
}

// Ensure TextDecoder is properly polyfilled
if (typeof global.TextDecoder !== 'function') {
  global.TextDecoder = class TextDecoder {
    encoding: string;
    fatal: boolean;
    ignoreBOM: boolean;

    constructor(
      encoding: string = 'utf-8',
      options: { fatal?: boolean; ignoreBOM?: boolean } = {}
    ) {
      this.encoding = encoding;
      this.fatal = options.fatal || false;
      this.ignoreBOM = options.ignoreBOM || false;
    }

    decode(input?: AllowSharedBufferSource): string {
      if (!input) return '';

      // Simple UTF-8 decoder for tests
      const bytes = new Uint8Array(
        input instanceof ArrayBuffer
          ? input
          : ArrayBuffer.isView(input)
            ? input.buffer
            : new ArrayBuffer(0)
      );
      let result = '';
      for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
      }
      return result;
    }
  };
}

// Mock window.fs.readFile
global.window = global.window || {};
window.fs = {
  readFile: vi.fn().mockImplementation(() => Promise.resolve(new Uint8Array())),
};

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock matchMedia
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock console.error to keep test output clean while still allowing error testing
const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args) => {
  if (process.env.DEBUG) {
    originalConsoleError(...args);
  }
});

// Set up Remix mock for all tests
const remixMock = createRemixStub();
vi.mock('@remix-run/react', () => remixMock);
