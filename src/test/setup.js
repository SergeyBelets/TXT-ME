import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto-cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Reset localStorage between tests
afterEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
