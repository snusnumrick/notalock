import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  storeReferringCategory,
  getReferringCategory,
  clearReferringCategory,
  type ReferringCategory,
} from '../referringCategoryUtils';

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('referringCategoryUtils', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const sampleCategory: ReferringCategory = {
    id: 'cat123',
    name: 'Premium',
    slug: 'premium',
    path: '/products/category/premium',
  };

  it('should store referring category in localStorage', () => {
    storeReferringCategory(sampleCategory);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'notalock_referring_category',
      JSON.stringify(sampleCategory)
    );
  });

  it('should retrieve referring category from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(sampleCategory));
    const result = getReferringCategory();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('notalock_referring_category');
    expect(result).toEqual(sampleCategory);
  });

  it('should return null when no referring category exists', () => {
    localStorageMock.getItem.mockReturnValue(null);
    const result = getReferringCategory();
    expect(result).toBeNull();
  });

  it('should clear referring category from localStorage', () => {
    clearReferringCategory();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('notalock_referring_category');
  });

  it('should handle JSON parse errors when retrieving', () => {
    console.error = vi.fn(); // Mock console.error
    localStorageMock.getItem.mockReturnValue('invalid-json');
    const result = getReferringCategory();
    expect(console.error).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should handle errors when storing', () => {
    console.error = vi.fn(); // Mock console.error
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    storeReferringCategory(sampleCategory);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle errors when clearing', () => {
    console.error = vi.fn(); // Mock console.error
    localStorageMock.removeItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    clearReferringCategory();
    expect(console.error).toHaveBeenCalled();
  });
});
