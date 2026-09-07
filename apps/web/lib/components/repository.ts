/**
 * Catalog repository. Supabase is the production source of truth; all rows are
 * validated before they enter the domain model.
 */

import type { PCComponent } from "@/types/component";
import { getSupabasePublicClient } from "@/lib/supabaseClient";
import {
  LEGACY_PRODUCT_SELECT,
  parseProductRow,
} from "./validation";

export type CatalogResult =
  | { success: true; data: PCComponent[] }
  | { success: false; error: string };

let browserCatalogRequest: Promise<CatalogResult> | null = null;

async function loadCatalog(): Promise<CatalogResult> {
  try {
    const supabase = getSupabasePublicClient();
    // Active rows are filtered by the public RLS policy after migration 002.
    // Omitting the new column keeps reads compatible during the rollout.
    const { data, error } = await supabase
      .from("products")
      .select(LEGACY_PRODUCT_SELECT)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching catalog from Supabase:", error);
      return {
        success: false,
        error: "No pudimos cargar el catálogo. Intenta nuevamente.",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "No se recibieron datos del catálogo.",
      };
    }

    const mapped = data
      .map(parseProductRow)
      .filter((component): component is PCComponent => component !== null);

    if (data.length > 0 && mapped.length === 0) {
      console.error("Catalog rows failed domain validation");
      return {
        success: false,
        error: "El catálogo contiene datos inválidos.",
      };
    }

    if (mapped.length !== data.length) {
      console.warn(
        `Ignored ${data.length - mapped.length} invalid catalog row(s)`,
      );
    }

    return { success: true, data: mapped };
  } catch (error) {
    console.error("Exception fetching catalog:", error);
    return {
      success: false,
      error: "No pudimos conectar con el catálogo. Intenta nuevamente.",
    };
  }
}

/**
 * Cache one request per browser session so the builder and its modal do not
 * download the same catalog twice. Server requests remain isolated.
 */
export function fetchCatalogFromSupabase(options?: {
  force?: boolean;
}): Promise<CatalogResult> {
  if (typeof window === "undefined") return loadCatalog();

  if (options?.force || !browserCatalogRequest) {
    browserCatalogRequest = loadCatalog();
  }

  return browserCatalogRequest;
}
