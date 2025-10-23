import { defineConfig } from "vite";

// ✅ Full working configuration for multi-page + Tailwind + PostCSS
export default defineConfig({
  root: "./",
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: false, // Disable annoying red overlay for CSS/PostCSS warnings
    },
  },
  css: {
    postcss: "./postcss.config.cjs", // Explicitly tell Vite where PostCSS config is
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
        register: "register.html",
        sell: "sell.html",
        settings: "settings.html",
      },
    },
  },
});
