import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative, because Pages serves this build from /the-quest/ rather than the
  // site root. Transylvania is configured the same way for the same reason.
  base: './',
  plugins: [preact()],
})
