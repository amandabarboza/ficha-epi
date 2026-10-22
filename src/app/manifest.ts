import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ficha de EPI",
    short_name: "Ficha EPI",
    description: "Controle de entrega de EPIs",
    lang: "pt-BR",
    start_url: "/retirada",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a3a3a",
    theme_color: "#1a3a3a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
