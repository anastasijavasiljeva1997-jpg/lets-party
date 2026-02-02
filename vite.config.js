import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { webfontDl } from 'vite-plugin-webfont-dl';

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
  plugins: [webfontDl()],
});
