import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        admin: "admin.html",
        balance: "balance.html",
        chat: "chat.html",
        login: "login.html",
        product: "product.html",
        register: "register.html",
        sell: "sell.html",
        settings: "settings.html"
      }
    },
    outDir: "dist",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true,
    hmr: { overlay: false }
  }
});
