import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        admin: "admin.html",
        balance: "balance.html",
        chat: "chat.html",
        login: "login.html",
        product: "product.html",
        sell: "sell.html",
        settings: "settings.html",
      },
    },
  },
});
