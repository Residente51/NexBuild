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

export type CatalogResult =
  | { success: true; data: PCComponent[] }
  | { success: false; error: string };

export function getAllComponents(): PCComponent[] {
  return components;
}

export function getComponentBySlug(slug: string): PCComponent | undefined {
  return components.find((component) => component.slug === slug);
}

export function searchComponents(query: string): PCComponent[] {
  return filterComponents(components, query);
}

interface SupabaseProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  specs: Record<string, unknown>;
  image_url?: string;
  store_listings?: Array<{ price_cash: number; product_url: string }>;
}

export async function fetchCatalogFromSupabase(): Promise<CatalogResult> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, store_listings(price_cash, product_url)');

    if (error) {
      console.error("Error fetching catalog from Supabase:", error);
      return { success: false, error: error.message || "Error desconocido al cargar el catálogo" };
    }

    if (!data) {
      return { success: false, error: "No se recibieron datos del servidor" };
    }

    const mapped = (data as SupabaseProduct[]).map((item) => {
      const listing = item.store_listings?.[0];
      const price = listing?.price_cash ?? 0;

      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        category: item.category,
        price,
        specs: item.specs,
        image: item.image_url,
      } as PCComponent;
    });

    return { success: true, data: mapped };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("Exception fetching catalog:", message);
    return { success: false, error: message };
  }
}
