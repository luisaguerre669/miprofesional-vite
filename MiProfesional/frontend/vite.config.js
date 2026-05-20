import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:10000',
        ws: true
      }
    }
  },
  build: {
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          recharts: ['recharts'],
          router: ['react-router-dom'],
          vendor: ['axios'],
          icons: ['lucide-react']
        }
      }
    }
  }
})
