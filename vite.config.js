import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'vendly-hosting-files',
    writeBundle(options) {
      for (const file of ['service-worker.js', '_headers']) {
        copyFileSync(resolve(file), resolve(options.dir, file));
      }
    }
  }],
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
        terms_lv: 'terms-lv.html',
        resend_verification: 'resend-verification.html'
      }
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  }
});
