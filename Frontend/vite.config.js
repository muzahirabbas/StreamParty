// File: vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // Import the plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'StreamParty',
        short_name: 'StreamParty',
        description: 'Peer-to-peer streaming and chat by Muzahir.',
        start_url: '/',
        // --- THIS IS THE FIX: Change display mode ---
        display: 'fullscreen', // Request hiding OS UI like status bar
        // --- END FIX ---
        background_color: '#1a1a1a',
        theme_color: '#007bff',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        url_handlers: [
          {
            "origin": "https://streamparty.pages.dev"
          }
        ]
      }
    })
  ],
})