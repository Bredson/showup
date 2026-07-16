/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  // Deployed at https://bredson.github.io/showup/ (Dylemat 10: GitHub Pages).
  // vite-plugin-pwa picks this up for the manifest scope and service worker paths.
  base: '/showup/',
  // Version shown in Settings → About; single source of truth is package.json.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Extra static files to precache (icons referenced from index.html / iOS).
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Showup',
        short_name: 'Showup',
        description: 'Your road to 100 push-ups — one session at a time.',
        theme_color: '#eaf6f3',
        background_color: '#eaf6f3',
        display: 'standalone',
        // Generated from public/icon.svg via `npm run generate-pwa-assets`.
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
  },
})
