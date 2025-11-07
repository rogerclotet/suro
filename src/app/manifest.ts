import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Família",
    short_name: "Família",
    description: "Gestor familiar",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
