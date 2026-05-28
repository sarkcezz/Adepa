import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Includes the manifest + service worker for the whole app, but the
        // offline experience is targeted at /employee/* (POS) — public pages
        // simply benefit from faster repeat loads.
        manifest: {
          name: 'Adepa Pork Hub',
          short_name: 'Adepa POS',
          description: 'Premium Ghanaian pork — point of sale and store.',
          theme_color: '#C0281A',
          background_color: '#FAF6EE',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/employee',
          scope: '/',
          icons: [
            { src: '/icons/adepa-mark.svg', sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
            { src: '/icons/adepa-mark.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
            { src: '/icons/adepa-mark.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          // Activate new SW immediately on deploy — users on a tab get the
          // latest code on next navigation instead of waiting for all tabs
          // to close.
          skipWaiting: true,
          clientsClaim: true,
          // Per-endpoint caching strategy. Hot data has a short TTL so a
          // price/stock change can't go stale for more than an hour even
          // if the user keeps the app open.
          runtimeCaching: [
            {
              // Hot data — products, orders, admin. Short TTL.
              urlPattern: ({ url }) =>
                url.pathname.includes('/api/v1/products') ||
                url.pathname.includes('/api/v1/orders') ||
                url.pathname.includes('/api/v1/admin'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'adepa-api-hot',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              },
            },
            {
              // Reference data — announcements, events, locations. Longer TTL.
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'adepa-api',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 100, maxAgeSeconds: 6 * 60 * 60 },
              },
            },
            {
              // Cloudinary product images — cache-first for snappy reloads.
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'adepa-cloudinary',
                expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      assetsDir: 'assets',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Split heavy third-party libs out of the per-route chunks so
          // they're cached separately and only redownloaded on lib updates.
          manualChunks: {
            'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts':   ['recharts'],
            'vendor-icons':    ['lucide-react'],
            'vendor-forms':    ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-utils':    ['axios', 'date-fns', 'clsx', 'tailwind-merge', 'sonner', 'zustand', 'idb'],
          },
        },
      },
    },
  }
})
