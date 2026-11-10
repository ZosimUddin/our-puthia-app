import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false // Disable SW in dev mode to prevent preview iframe reloads
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          id: '/',
          name: 'আমাদের পুঠিয়া - স্মার্ট সিটিজেন পোর্টাল',
          short_name: 'পুঠিয়া পোর্টাল',
          description: 'পুঠিয়া উপজেলার সকল সেবা, হাসপাতাল, রক্তদাতা, শিক্ষা প্রতিষ্ঠান ও রাজবাড়ির তথ্য এক অ্যাপে',
          start_url: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#064e3b',
          theme_color: '#064e3b',
          scope: '/',
          categories: ['government', 'utilities', 'travel', 'medical'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        injectManifest: {
          rollupFormat: 'iife',
          maximumFileSizeToCacheInBytes: 10000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          globIgnores: [
            '**/vendor-pdf-tools-*.js',
            '**/jspdf*',
            '**/pdf*',
            '**/html2canvas*',
            '**/vendor-charts*',
            '**/vendor-lottie*',
            '**/vendor-maps*',
            '**/*Admin*.js',
            '**/Moderator*.js',
            '**/RoleManagement*.js',
            '**/ContentManagement*.js',
            '**/ReportsAndModeration*.js',
            '**/*Management*.js',
            '**/Adda*Control*.js',
            '**/AddaModerationCenter*.js',
            '**/sample-reel.mp4',
            '**/our-puthia.apk',
            '**/puthia_og_banner.jpg'
          ]
        }
      })
    ],
    build: {
      minify: 'esbuild' as const,
      cssMinify: true,
      target: 'es2020',
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lottie-web') || id.includes('lottie-react')) {
                return 'vendor-lottie';
              }
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'vendor-maps';
              }
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
            }
          }
        }
      }
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(process.cwd(), './src'),
        'react': path.resolve(process.cwd(), './node_modules/react'),
        'react-dom': path.resolve(process.cwd(), './node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(process.cwd(), './node_modules/react/jsx-runtime.js'),
        'react/jsx-dev-runtime': path.resolve(process.cwd(), './node_modules/react/jsx-dev-runtime.js'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router-dom',
        'motion/react',
        'lucide-react',
        'date-fns',
        'date-fns/locale',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'sonner'
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
