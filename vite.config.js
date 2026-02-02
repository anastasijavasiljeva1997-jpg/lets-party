import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { webfontDl } from 'vite-plugin-webfont-dl';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

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
  plugins: [
    webfontDl(
      [
        'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
      ],
      {
        inject: true,
        async: false,
      }
    ),
    ,
    ViteImageOptimizer({
      jpg: { quality: 80 },
      webp: { lossy: true, quality: 80 },
      avif: { quality: 70 },
    }),
  ],
});
