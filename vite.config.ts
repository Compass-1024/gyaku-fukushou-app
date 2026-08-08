import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      manifest: {
        name: '逆復唱トレーニング',
        short_name: '逆復唱',
        description:
          '言葉や数字を聞いたり見たりして、逆から答えるワーキングメモリトレーニング',
        lang: 'ja',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // ホーム画面アイコンの長押し（Android）・右クリック（デスクトップ）から
        // 各モードのレベル選択画面へ直接ジャンプできるショートカット。
        // 対応環境は限定的（主要ブラウザのAndroid/ChromeOS/一部デスクトップ）だが、
        // 非対応環境では単に無視されるだけなので害はない
        shortcuts: [
          {
            name: 'ことばモード',
            url: '/?shortcut=word',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'すうじモード',
            url: '/?shortcut=digit-reverse',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Nバックモード',
            url: '/?shortcut=nback',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: '空間モード',
            url: '/?shortcut=spatial',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'デュアルNバックモード',
            url: '/?shortcut=dual-nback',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: '変化検出モード',
            url: '/?shortcut=pattern',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: '音・色モード',
            url: '/?shortcut=tone',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
})
