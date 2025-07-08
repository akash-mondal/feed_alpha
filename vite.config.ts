// ./vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces

    // --- THIS IS THE FIX ---
    // Allow requests from any ngrok free-tier subdomain.
    allowedHosts: ['.ngrok-free.app'],

    proxy: {
      '/twitter-api': {
        target: 'https://api.twitterapi.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/twitter-api/, ''),
        secure: true
      },
      '/ai-api': {
        target: 'https://api.together.xyz/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-api/, ''),
        secure: true
      },
      '/telegram-api': {
        target: 'https://tele-extract.fly.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/telegram-api/, ''),
        secure: true
      }
    }
  }
});
