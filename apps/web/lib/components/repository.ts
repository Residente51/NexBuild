/**
 * Component repository.
 *
 * Supabase is the single source of truth for component data.
 * All reads go through this module, ensuring consistency and
 * making it easy to swap implementations without affecting callers.
 */

import type { PCComponent } from "@/types/component";
import { supabase } from "../supabaseClient";

export type CatalogResult =
  | { success: true; data: PCComponent[] }
  | { success: false; error: string };

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
    // Explicit column selection instead of select('*') for type safety and performance
    const { data, error } = await supabase
      .from('products')
      .select('id, slug, name, brand, category, specs, image_url, store_listings(price_cash, product_url)');

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

      // Type-safe mapping with explicit validation
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
