import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Família",
    short_name: "Família",
    description: "Gestor familiar",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#121621",
    background_color: "#121621",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
