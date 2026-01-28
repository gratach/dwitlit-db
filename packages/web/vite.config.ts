import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path/win32'

console.log("VITE CONFIG LOADED FROM WEB");

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "dwitlit-shared": path.resolve(__dirname, "../shared/src")
    }
  }
})
