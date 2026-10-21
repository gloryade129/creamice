import type { MetadataRoute } from "next";
import { getSitemapProducts } from "@/lib/data/storefront";
import { getPublicUpdates } from "@/lib/data/updates";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, updates] = await Promise.all([
    getSitemapProducts(),
    getPublicUpdates(1000),
  ]);

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/updates"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/track"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...updates.map((update) => ({
      url: absoluteUrl(`/updates/${update.slug}`),
      lastModified: new Date(update.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
