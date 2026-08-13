import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "StockAlert — Control de inventario",
        short_name: "StockAlert",
        description: "Inventario y control de vencimientos multi-sucursal para supermercados",
        lang: "es-AR",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0b0f",
        theme_color: "#0a0b0f",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // Nunca interceptar la API: los datos siempre van frescos al servidor
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  base: "/",
  server: {
    port: 5173
  },
  test: {
    globals: true,
    // Entorno node por defecto: la mayoria de la logica es pura y no toca el DOM.
    // Los tests que necesitan DOM declaran jsdom con un comentario // @vitest-environment jsdom
    environment: "node",
    pool: "forks",
    setupFiles: "./src/test/setup.js"
  }
});
