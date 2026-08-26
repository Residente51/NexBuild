/**
 * Component repository.
 *
 * The single entry point for component data. Everything else reads
 * components through this module, so replacing data/components.ts with
 * an API or a database stays confined to this file.
 *
 * Synchronous for now. Keep it out of Client Components so it can
 * become async without restructuring its callers.
 */

import { components } from "@/data/components";
import type { PCComponent } from "@/types/component";
import { supabase } from "../supabaseClient";

import { filterComponents } from "./search";

export function getAllComponents(): PCComponent[] {
  return components;
}

export function getComponentBySlug(slug: string): PCComponent | undefined {
  return components.find((component) => component.slug === slug);
}

export function searchComponents(query: string): PCComponent[] {
  return filterComponents(components, query);
}

export async function fetchCatalogFromSupabase(): Promise<PCComponent[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, store_listings(price_cash, product_url)');

  if (error || !data) {
    console.error("Error fetching catalog from Supabase:", error);
    return [];
  }

  return data.map((item: any) => {
    const listing = item.store_listings?.[0];
    const price = listing?.price_cash ?? 0;

    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      category: item.category,
      price: price,
      specs: item.specs,
      image_url: item.image_url,
    } as PCComponent;
  });
}
