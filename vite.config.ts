import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

// Chunk grouping rationale:
// - Keep framework core (react libs) together for long‑term caching.
// - Separate supabase + auth/network libs to avoid invalidating core on backend SDK updates.
// - Heavy AI / ML related libs (tf / universal sentence encoder / generative AI) isolated & lazy‑load friendly.
// - Misc visual / utility libs grouped.
// NOTE: If some groups become empty (unused), Rollup just omits the chunk.

export default defineConfig({
  plugins: [
    react(),
    // Provides a sensible baseline split; our manualChunks refines further.
    splitVendorChunkPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/]react(?!-router)/.test(id) || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@google/generative-ai')) return 'vendor-ai-gen';
            if (id.includes('@tensorflow')) return 'vendor-tf';
            if (id.includes('universal-sentence-encoder')) return 'vendor-tf';
            if (id.includes('qrcode') || id.includes('react-qr-code')) return 'vendor-qrcode';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            if (id.includes('react-ga4')) return 'vendor-analytics';
          }
          return undefined; // default handling
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },
    },
    // Raise warning limit now that we intentionally split; adjust as needed.
    chunkSizeWarningLimit: 800,
    target: 'esnext',
    sourcemap: false,
  },
  optimizeDeps: {
    // Excluding large or server-only libs from pre-bundling (some appear unused in browser).
    exclude: [
      'aws-sdk', // v2 AWS SDK is very large; prefer @aws-sdk/* modular v3 on the server if needed
      'mock-aws-s3',
      'nock',
      '@mapbox/node-pre-gyp',
      '@mswjs/interceptors',
      'lucide-react',
      '@tensorflow/tfjs-node', // node-only; ensure browser code imports '@tensorflow/tfjs' instead
    ],
  },
});
