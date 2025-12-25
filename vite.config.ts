// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import netlify from '@netlify/vite-plugin-tanstack-start'

export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
     netlify(),
    VitePWA({
  // Since we handle registration manually in TanStack Start
  injectRegister: false, 
  registerType: 'autoUpdate', 
  
  // ✅ Keeps assets cached for iPadOS splash screens and icons
  includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'favicon-96x96.png'],
  
  manifest: {
    name: 'Mündlich Plus',
    short_name: 'Mündlich+',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone', // CRITICAL: iPadOS needs this to enable offline SW mode
    scope: '/',
    start_url: '/',
    orientation: 'portrait',
    icons: [
      {
        src: 'web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  },
  workbox: {
    // ✅ Boosted limit for TanStack Start's bundled chunks
    maximumFileSizeToCacheInBytes: 3000000,
    
    // ✅ Caches all your assets during the initial install
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    
    // ✅ CRITICAL: Essential for client-side routing on iPadOS.
    // If you are offline and on /calendar, it serves index.html so TanStack Router can work.
    navigateFallback: '/index.html',
    
    // ✅ Keep our API/Database excludes
    navigateFallbackDenylist: [/^\/convex/, /^\/api/],
    
    cleanupOutdatedCaches: true,
  },
  devOptions: {
    enabled: true,
    type: 'module',
  },
}),
    tanstackStart({
      srcDirectory: '.',
      router: {
        routesDirectory: 'app', 
      },
    }),
    viteReact(),
  ],
})
