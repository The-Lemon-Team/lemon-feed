import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5177,
    proxy: {
      '/api/external': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/notes': 'http://localhost:3001',
      '/feeds': 'http://localhost:3001',
      '/taxonomy': 'http://localhost:3001',
      '/hashtags': 'http://localhost:3001',
      '/folders': 'http://localhost:3001',
      '/sync': 'http://localhost:3001',
      '/storage': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      '/keys': 'http://localhost:3001',
      '/containers': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
      '/stats': 'http://localhost:3001',
      '/api': 'http://localhost:3001',
      '/ingestion': 'http://localhost:3001',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'vendor-markdown';
            }
            if (id.includes('dayjs')) {
              return 'vendor-dayjs';
            }
          }
        },
      },
    },
  },
});
