/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['string.agne.uk', 'piggii.agne.uk', 'localhost', '127.0.0.1'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
