import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/local-api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
    },
    // 说明：这是本地开发用代理，部署到 Vercel 时不生效
  }
})
