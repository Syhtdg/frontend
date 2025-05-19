// vite.config.mjs
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Fonts from 'unplugin-fonts/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    VueRouter(),
    Pages({ dirs: 'src/pages', extensions: ['vue'] }),
    Layouts({ layoutsDirs: 'src/layouts', defaultLayout: 'default' }),
    Vue({ template: { transformAssetUrls } }),
    Vuetify({ autoImport: true, styles: { configFile: 'src/styles/settings.scss' } }),
    Components(),
    Fonts({
      google: {
        families: [{ name: 'Roboto', styles: 'wght@100;300;400;500;700;900' }],
      },
    }),
    AutoImport({
      imports: ['vue', 'vue-router'],
      eslintrc: { enabled: true },
      vueTemplate: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:10111',  // 백엔드 Express 서버 포트
        changeOrigin: true,
        // pathRewrite: { '^/api': '/api' } // 필요 없음
      },
      '/cctv-stream': {
        target: 'http://cctvsec.ktict.co.kr',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/cctv-stream/, '')
      }
    },
  },
  define: { 'process.env': {} },
})
