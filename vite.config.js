import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Serve index.html for all routes so React handles /portal client-side
    historyApiFallback: true,
  }
})
