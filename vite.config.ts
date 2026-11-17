import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// base: "./" — uygulama hangi alt dizinde yayınlanırsa yayınlansın çalışır (ör. GitHub Pages)
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Akılda — YKS tekrar",
        short_name: "Akılda",
        description: "MEB ders kitaplarındaki bilgileri kısa sorularla hatırlatan YKS tekrar uygulaması.",
        lang: "tr",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#fff8ef",
        theme_color: "#ff8a1f",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
