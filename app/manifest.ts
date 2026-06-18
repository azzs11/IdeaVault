import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IdeaVault",
    short_name: "IdeaVault",
    description: "Your collaborative idea space",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#4f46e5",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
