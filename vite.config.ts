import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isPublicMode = mode === 'public' || process.env.VITE_FEED_APP_MODE === 'public';
  const defaultPort = isPublicMode ? 5181 : 5180;
  const port = Number(process.env.VITE_PORT || process.env.PORT || defaultPort);
  return {
  envDir: path.resolve(__dirname, '../../'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lenta/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      'dayjs',
      'dayjs/locale/ru',
      'lucide-react',
      'axios',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    port,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api/external': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/notes': 'http://localhost:3002',
      '/feeds': 'http://localhost:3002',
      '/taxonomy': 'http://localhost:3002',
      '/hashtags': 'http://localhost:3002',
      '/folders': 'http://localhost:3002',
      '/sync': 'http://localhost:3002',
      '/storage': 'http://localhost:3002',
      '/uploads': 'http://localhost:3002',
      '/keys': 'http://localhost:3002',
      '/containers': 'http://localhost:3002',
      '/health': 'http://localhost:3002',
      '/stats': 'http://localhost:3002',
      '/api': 'http://localhost:3002',
      '/ingestion': 'http://localhost:3002',
      '/workspaces': 'http://localhost:3002',
      '/events': 'http://localhost:3002',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normalized = id.replace(/\\/g, '/');
            if (
              normalized.includes('/node_modules/react/') ||
              normalized.includes('/node_modules/react-dom/') ||
              normalized.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (normalized.includes('/node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
            if (normalized.includes('/node_modules/@tanstack/')) {
              return 'vendor-tanstack';
            }
            if (
              normalized.includes('/node_modules/react-markdown/') ||
              normalized.includes('/node_modules/remark-gfm/') ||
              normalized.includes('/node_modules/unified/') ||
              normalized.includes('/node_modules/micromark')
            ) {
              return 'vendor-markdown';
            }
            if (normalized.includes('/node_modules/dayjs/')) {
              return 'vendor-dayjs';
            }
          }
        },
      },
    },
  },
  };
});
