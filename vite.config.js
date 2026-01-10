import { defineConfig } from 'vite';

export default defineConfig({
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
        main: 'index.html',
      },
    },
    outDir: 'dist/public',
    emptyOutDir: true,
  }
});
