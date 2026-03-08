import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: '0.0.0.0',
    port: 5000,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'favicon-96x96.png'],
      manifest: {
        name: 'Mündlich Plus',
        short_name: 'Mündlich+',
        description: 'Behalte den Überblick über deine mündliche Beteiligung',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. Vendor: React Core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react'
          }

          // 2. Vendor: Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }

          // 3. Vendor: UI Libraries (Radix / Shadcn / Lucide)
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/lucide-react') || id.includes('node_modules/class-variance-authority')) {
            return 'vendor-ui'
          }

          // 4. Vendor: Utilities
          if (id.includes('node_modules/compressorjs') || id.includes('node_modules/date-fns')) {
            return 'vendor-utils'
          }
        },
      },
    },
  },
}))
