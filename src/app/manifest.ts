import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Família",
    short_name: "Família",
    description: "Gestor familiar",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#2A303C",
    theme_color: "#9FE88D",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
