import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { sentryVitePlugin } from '@sentry/vite-plugin';

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
    // Upload source maps to Sentry on production builds
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Only upload source maps in production builds
      disable: process.env.NODE_ENV !== 'production',
      sourcemaps: {
        assets: './dist/**',
      },
    }),
  ],
  envDir: path.resolve(__dirname, '../..'),
  server: {
    port: 5175,
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
  build: {
    sourcemap: true, // Generate source maps for production builds
  },
});
