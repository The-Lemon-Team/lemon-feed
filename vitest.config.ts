import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@feed-core': path.resolve(__dirname, './src/core'),
      '@feed-watchers': path.resolve(__dirname, '../feed-watchers/src'),
      '@lenta/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@lenta/lemon-bus': path.resolve(__dirname, '../../packages/lemon-bus/dist'),
      '@lenta/seasons-neurons': path.resolve(__dirname, '../../packages/seasons-neurons/dist'),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
});
