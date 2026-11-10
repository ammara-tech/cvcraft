import type { MetadataRoute } from "next";

/* Makes CVcraft installable: "Add to Home screen" on a phone opens it full screen, like an app */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CVcraft",
    short_name: "CVcraft",
    description: "Make a clear one-page CV, with tips as you type.",
    start_url: "/",
    display: "standalone",
    background_color: "#eeece7",
    theme_color: "#1f4e79",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
