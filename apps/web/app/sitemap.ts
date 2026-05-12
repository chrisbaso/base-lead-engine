import type { MetadataRoute } from "next";
import { getInsightPosts, insightCategories, categoryToSlug } from "./_lib/retire-ready-insights";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://retirereadymn.com";
  const posts = await getInsightPosts();
  const staticRoutes = ["", "/checkup", "/insights", ...insightCategories.map((category) => `/insights/category/${categoryToSlug(category)}`)];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date()
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/insights/${post.slug}`,
      lastModified: new Date(post.publishedAt)
    }))
  ];
}
