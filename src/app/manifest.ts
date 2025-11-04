import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Família",
    short_name: "Família",
    description: "Gestor familiar",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "oklch(0.2677 0.0224 262.4632)",
    theme_color: "oklch(0.8411 0.1051 139.5336)",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
