/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
