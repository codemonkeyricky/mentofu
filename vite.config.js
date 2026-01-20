import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/client',
  base: '/',  // Add this line - ensures correct base path for assets
  server: {
    proxy: {
      '/auth': 'http://localhost:4000',
      '/session': 'http://localhost:4000',
      '/credit': 'http://localhost:4000',
      '/parent': 'http://localhost:4000',
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/client/index.html'),
      },
      output: {
        // Add this to ensure consistent chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
  },
  publicDir: path.resolve(__dirname, 'src/client/public'),
  resolve: {
    // Add this to ensure proper module resolution
    alias: {
      '@': path.resolve(__dirname, 'src/client'),
    }
  },
});
