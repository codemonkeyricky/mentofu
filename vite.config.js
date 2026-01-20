import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  root: 'src/client',
  base: '/',
  server: {
    proxy: {
      '/auth': 'http://localhost:4000',
      '/session': 'http://localhost:4000',
      '/credit': 'http://localhost:4000',
      // Only proxy API calls, not static JS files
      '/parent/api': 'http://localhost:4000',
      '/parent/login': 'http://localhost:4000',
      '/parent/users': 'http://localhost:4000',
      '/parent/credits': 'http://localhost:4000',
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/client/index.html'),
      },
      output: {
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
    alias: {
      '@': path.resolve(__dirname, 'src/client'),
    },
    // Add this to help with extension resolution
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  },
  // Try adding this to prevent SPA fallback for .js files
  appType: 'mpa',  // "multi-page app" instead of default "spa"
});
