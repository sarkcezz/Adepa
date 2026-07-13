import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const STATIC_ROUTES = ["", "/menu", "/stands", "/events", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
