import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: '.',        // root folder (where your HTML files are)
  build: {
    outDir: 'dist', // output folder
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
        settings: 'settings.html'
      }
    }
  }
});
