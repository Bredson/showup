import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates PWA icons from public/icon.svg (run: npm run generate-pwa-assets).
// icon.svg is a full-bleed design with the motif inside the 80% safe zone,
// so every variant uses padding 0 — no extra background ring is needed.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
      padding: 0,
    },
    maskable: {
      sizes: [512],
      padding: 0,
    },
    apple: {
      sizes: [180],
      padding: 0,
    },
  },
  images: ['public/icon.svg'],
})
