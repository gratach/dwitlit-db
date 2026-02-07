import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

console.log("VITE CONFIG LOADED FROM TAURI");

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@dwitlit-db/ui": path.resolve(__dirname, "../ui/src")
    }
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
  }
})
