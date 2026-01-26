import { defineConfig } from "vite";

export default defineConfig({
  root: "./", // your project root
  build: {
    outDir: "dist", // default output folder
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
        settings: "settings.html",
      },
    },
  },
});
