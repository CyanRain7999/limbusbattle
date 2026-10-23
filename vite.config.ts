import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  publicDir: 'public/runtime',
  server: { watch: { usePolling: true, interval: 250, ignored: ['**/.cache/**','**/docs/screenshots/**','**/test-results/**'] } },
  plugins: [VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon-192.png', 'icon-512.png'],
    manifest: {
      name: '边狱交锋 · Limbus Clash', short_name: '边狱交锋',
      description: '非官方同人像素格斗 · 离线单机与本地双人',
      id:'./',start_url:'./',scope:'./',lang:'zh-CN',categories:['games','entertainment'],
      theme_color: '#171a1b', background_color: '#101314', display: 'standalone',display_override:['fullscreen','standalone'], orientation: 'landscape',
      icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png',purpose:'any' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
    },
    workbox: { globPatterns: ['**/*.{js,css,html,png,json,svg,woff2}'],cleanupOutdatedCaches:true,navigateFallback:'index.html', maximumFileSizeToCacheInBytes: 4000000 }
  })],
  build: { target: 'es2022', rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' }
} as Parameters<typeof defineConfig>[0]);
