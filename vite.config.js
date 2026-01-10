import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src/client',
  server: {
    proxy: {
      '/auth': 'http://localhost:4000',
      '/session': 'http://localhost:4000',
      '/stats': 'http://localhost:4000',
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/client/index.html'),
      },
    },
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
  },
  publicDir: path.resolve(__dirname, 'src/client/public'),
});
