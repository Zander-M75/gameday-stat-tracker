import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Silently install and activate updated service workers on the next
      // load rather than prompting mid-game — a coach mid-quarter should
      // never see an update dialog, per CLAUDE.md's "sync/update mechanics
      // must never interrupt stat entry" rule.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Gameday Stat Tracker',
        short_name: 'Gameday',
        description: 'Offline-first lacrosse stat tracker for the sideline.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Coach's phone is portrait, the bench iPad is often landscape —
        // the shell already adapts to both (see useBreakpoint), so the
        // manifest shouldn't lock orientation and fight that.
        orientation: 'any',
        background_color: '#0a0e14',
        theme_color: '#0a0e14',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell + static assets only for now — there's no network API
        // to runtime-cache yet (Supabase sync lands in phase 7/8), just the
        // build output Vite already emits into dist/.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
