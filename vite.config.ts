import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function readEnvFile(dir: string): Record<string, string> {
  const envPath = path.resolve(dir, '.env');
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[match[1]] = val;
    }
  }
  return result;
}

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../../');
  const rawFileEnv = readEnvFile(envDir);
  const fileEnv = loadEnv(mode, envDir, '');
  const env = { ...(process.env as Record<string, string>), ...fileEnv, ...rawFileEnv };
  const isPublicMode = mode === 'public' || env.VITE_FEED_APP_MODE === 'public';
  const isWatchersMode = mode === 'watchers' || env.VITE_FEED_ENV === 'watchers';
  const defaultPort = isWatchersMode ? 5182 : isPublicMode ? 5181 : 5180;
  const port = Number(env.VITE_PORT || env.PORT || defaultPort);
  const outDir = isWatchersMode ? 'dist-watchers' : isPublicMode ? 'dist-public' : 'dist';
  const watchersTarget = env.VITE_WATCHERS_PROXY_TARGET || 'http://127.0.0.1:3040';
  const backendTarget = rawFileEnv.VITE_API_URL || env.VITE_API_URL || 'http://localhost:3002';
  return {
  envDir,
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(backendTarget),
  },
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
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
    proxy: {
      '/watchers-api': {
        target: watchersTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/watchers-api/, ''),
      },
      '/_api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/_api/, ''),
      },
      '/api/external': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/moderation': {
        target: 'http://127.0.0.1:3030',
        changeOrigin: true,
      },
      '/notes': backendTarget,
      '/feeds': backendTarget,
      '/streams': backendTarget,
      '/taxonomy': backendTarget,
      '/hashtags': backendTarget,
      '/folders': backendTarget,
      '/sync': backendTarget,
      '/storage': backendTarget,
      '/uploads': backendTarget,
      '/keys': backendTarget,
      '/containers': backendTarget,
      '/health': backendTarget,
      '/stats': backendTarget,
      '/api': backendTarget,
      '/ingestion': backendTarget,
      '/workspaces': backendTarget,
      '/events': backendTarget,
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
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
