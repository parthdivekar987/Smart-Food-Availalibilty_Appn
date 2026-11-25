import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  // VITE_DEV_HTTPS=true serves the dev site over HTTPS (self-signed). Phones only allow camera
  // access (QR scanner) on HTTPS pages, so enable this when testing on a phone over Wi-Fi.
  const devHttps = env.VITE_DEV_HTTPS === 'true'
  // Backend the dev server forwards /api, /socket.io and /uploads to (same-origin = no mixed content/CORS issues)
  const backend = env.VITE_DEV_BACKEND || 'http://localhost:4000'

  return {
    plugins: [react(), tailwindcss(), ...(devHttps ? [basicSsl()] : [])],
    server: {
      port: 5173,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/uploads': { target: backend, changeOrigin: true },
        '/socket.io': { target: backend, changeOrigin: true, ws: true },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-three': ['three'],
            'vendor-charts': ['recharts', 'chart.js'],
            'vendor-ui': ['framer-motion', 'lucide-react', 'sweetalert2'],
          },
        },
      },
    },
  }
})
