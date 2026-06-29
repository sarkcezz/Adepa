import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adepa Pork Hub",
    short_name: "Adepa",
    description: "Premium Ghanaian pork — fresh cuts and ready-to-eat platters, delivered.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFAF6",
    theme_color: "#165C42",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
