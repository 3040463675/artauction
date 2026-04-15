import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  esbuild: {
    charset: 'utf8'
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://10.216.80.84:8081',
        changeOrigin: true
      }
    }
  },
  define: {
    __VITE_NFT_CONTRACT_ADDRESS__: JSON.stringify(process.env.VITE_NFT_CONTRACT_ADDRESS || ''),
    __VITE_AUCTION_CONTRACT_ADDRESS__: JSON.stringify(process.env.VITE_AUCTION_CONTRACT_ADDRESS || '')
  }
})
