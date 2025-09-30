import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/ReSnake/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: false,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
