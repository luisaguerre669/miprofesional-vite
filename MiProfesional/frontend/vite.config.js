import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isNative = mode === 'native'

  return {
    base: './',
    resolve: {
      alias: [
        // For native mode, match @/lib/axios before the general @ alias
        ...(isNative
          ? [
              {
                find: /^@\/lib\/axios$/,
                replacement: path.resolve(__dirname, 'src/lib/axios-native.js'),
              },
              {
                find: /^(?:\.\.\/)*(?:\.\/)?lib\/axios$/,
                replacement: path.resolve(__dirname, 'src/lib/axios-native.js'),
              },
            ]
          : []),
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
    },
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:10000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:10000',
          ws: true,
        },
      },
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()',
      },
    },
    build: {
      sourcemap: process.env.NODE_ENV === 'development' ? true : false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('react')) return 'react';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('axios')) return 'vendor';
            if (id.includes('lucide-react')) return 'icons';
          },
        },
      },
    },
  }
})
