import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of a custom domain, so base stays '/'.
  base: '/',
  plugins: [react()],
})
