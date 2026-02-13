import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lv: resolve(__dirname, 'lv/index.html'),
        en: resolve(__dirname, 'en/index.html'),
      },
    },
  },
});
