import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

// Polyfill browser APIs not implemented in jsdom
if (typeof window !== 'undefined') {
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' } as any));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

