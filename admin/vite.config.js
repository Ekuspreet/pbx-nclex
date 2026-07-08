import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '../client/node_modules/vite/dist/node/index.js'
import react from '../client/node_modules/@vitejs/plugin-react/dist/index.js'
import tailwindcss from '../client/node_modules/@tailwindcss/vite/dist/index.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientModules = path.resolve(__dirname, '../client/node_modules')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      react: path.join(clientModules, 'react'),
      'react-dom': path.join(clientModules, 'react-dom'),
      'react-dom/client': path.join(clientModules, 'react-dom/client'),
      'react-router-dom': path.join(clientModules, 'react-router-dom'),
    },
  },
})
