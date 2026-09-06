/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src*"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/__/auth": {
        target: "https://login-oauth-casa-do-hambuguer.firebaseapp.com",
        changeOrigin: true,
        secure: true,
        ws: true,
      },
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  test: {
    globals: true,
    environment: "jsdom", // Necessário para simular o DOM no front-end
    setupFiles: "./src/test/setup.ts", // Opcional: para configurações globais
  },
});
