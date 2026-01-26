import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  server: {
    port: 5173,
    open: true,
  },
  css: {
    postcss: "./postcss.config.cjs",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: "index.html",
        admin: "admin.html",
        balance: "balance.html",
        chat: "chat.html",
        login: "login.html",
        product: "product.html",
        register: "register.html",
        sell: "sell.html",
        settings: "settings.html",
      },
    },
  },
});
