import '@testing-library/jest-dom';

const mockMatchMedia = () => ({
  matches: false,
  media: '',
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: () => mockMatchMedia(),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock window.fs.readFile for tests
if (!window.fs) {
  window.fs = {
    readFile: () => Promise.resolve(new Uint8Array()),
  };
}

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

window.ResizeObserver = MockResizeObserver;
