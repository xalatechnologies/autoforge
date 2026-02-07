import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

// Plugin to copy theme files from @xala/ds-themes to public/themes
function copyThemes(): Plugin {
  const themesSource = path.resolve(__dirname, '../../packages/ds-themes/themes');
  const themesDest = path.resolve(__dirname, 'public/themes');

  return {
    name: 'copy-themes',
    buildStart() {
      if (!fs.existsSync(themesDest)) {
        fs.mkdirSync(themesDest, { recursive: true });
      }
      if (fs.existsSync(themesSource)) {
        const files = fs.readdirSync(themesSource).filter(f => f.endsWith('.css'));
        for (const file of files) {
          fs.copyFileSync(
            path.join(themesSource, file),
            path.join(themesDest, file)
          );
        }
        console.log(`[copy-themes] Copied ${files.length} theme files from packages/ds-themes`);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    copyThemes(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.png', 'logo.svg', 'manifest.json'],
      manifest: {
        name: 'Min Side',
        short_name: 'Min Side',
        description: 'Norwegian municipal citizen portal',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/api\/.*\/*.json/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/api\/bookings\/my/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bookings-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours for offline viewing
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  envDir: path.resolve(__dirname, '../..'),
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@xalabaas/sdk': path.resolve(__dirname, '../../packages/sdk/src'),
    },
  },
  optimizeDeps: {
    exclude: ['@xalabaas/sdk'],
  },
});
