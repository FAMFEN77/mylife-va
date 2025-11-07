import type { MetadataRoute } from "next";

import { APP_NAME, BRAND_SHORT, APP_URL } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: BRAND_SHORT,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#8658FF",
    description: `${APP_NAME} helpt teams met planning, taken en klantprocessen in één assistent.`,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "apple-touch-icon",
      },
    ],
    scope: "/",
    id: APP_URL,
  };
}
