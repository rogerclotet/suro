import * as m from "@/paraglide/messages";

export function manifestJSONHandler() {
  return new Response(
    JSON.stringify({
      name: m.app_name(),
      short_name: m.app_name(),
      description: m.app_description(),
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      theme_color: "#121621",
      background_color: "#121621",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/android-chrome-192x192-maskable.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/android-chrome-512x512-maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
