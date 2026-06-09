import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,         // Listen on all local IP addresses (0.0.0.0)
    port: 5173,         // Set a consistent port
    strictPort: true,   // Fail if the port is busy instead of picking a random one
    watch: {
      usePolling: true, // Required for hot module replacement (HMR) to work in containers
    },
  },
})
