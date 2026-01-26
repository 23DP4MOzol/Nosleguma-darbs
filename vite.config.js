import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  base: "./", // crucial for relative paths in multi-page apps
  build: {
    outDir: "dist",
    assetsDir: "assets", // all JS/CSS/images go into dist/assets
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
