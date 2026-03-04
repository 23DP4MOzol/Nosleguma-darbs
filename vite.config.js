import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: 'index.html',
        admin: 'admin.html',
        balance: 'balance.html',
        chat: 'chat.html',
        login: 'login.html',
        product: 'product.html',
        register: 'register.html',
        sell: 'sell.html',
        settings: 'settings.html',
        orders: 'orders.html',
        terms: 'terms.html',
        terms_lv: 'terms-lv.html'
      }
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  }
});
