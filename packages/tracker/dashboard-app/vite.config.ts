import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, '..', 'dist-dashboard'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4321',
      '/ws': {
        target: 'ws://localhost:4321',
        ws: true,
      },
    },
  },
})
