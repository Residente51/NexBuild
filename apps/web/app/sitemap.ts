import type { MetadataRoute } from "next";

import { fetchCatalogFromSupabase } from "@/lib/components/repository";

const SITE_URL = "https://nexbuild.games";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL },
    { url: `${SITE_URL}/components` },
    { url: `${SITE_URL}/builder` },
    { url: `${SITE_URL}/compare` },
  ];
  const result = await fetchCatalogFromSupabase();

  if (!result.success) return staticRoutes;

  return [
    ...staticRoutes,
    ...result.data.map((component) => ({
      url: `${SITE_URL}/components/${encodeURIComponent(component.slug)}`,
    })),
  ];
}
