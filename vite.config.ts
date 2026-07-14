/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  // Deployed at https://bredson.github.io/unstuck/ (Dylemat 10: GitHub Pages).
  // vite-plugin-pwa picks this up for the manifest scope and service worker paths.
  base: '/unstuck/',
  // Version shown in Settings → About; single source of truth is package.json.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Unstuck',
        short_name: 'Unstuck',
        description: 'One small challenge a day, no pressure.',
        theme_color: '#fdf6ec',
        background_color: '#fdf6ec',
        display: 'standalone',
        // icons: added in Faza 4 (need generated assets first)
      },
    }),
  ],
  test: {
    environment: 'jsdom',
  },
})
