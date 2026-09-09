"use server";

import { calculateBuildPrice } from "@/lib/build/totals";
import {
  LEGACY_PRODUCT_SELECT,
  parseProductRow,
  PRODUCT_SELECT,
} from "@/lib/components/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { BuildSelection, PCComponent } from "@/types/component";

const SINGLE_SLOTS = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "case",
  "cooler",
  "psu",
] as const;
const MAX_STORAGE_DEVICES = 8;

export type BuildComponentIds = Partial<
  Record<(typeof SINGLE_SLOTS)[number], string>
> & { storage?: string[] };

function normalizeComponentIds(value: unknown):
  | { success: true; data: BuildComponentIds; ids: string[] }
  | { success: false; error: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { success: false, error: "Configuración inválida." };
  }

  const input = value as Record<string, unknown>;
  const allowedKeys = new Set([...SINGLE_SLOTS, "storage"]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    return { success: false, error: "La configuración contiene campos desconocidos." };
  }

  const normalized: BuildComponentIds = {};
  const ids: string[] = [];
  for (const slot of SINGLE_SLOTS) {
    const id = input[slot];
    if (id == null) continue;
    if (typeof id !== "string" || id.trim().length === 0 || id.length > 128) {
      return { success: false, error: `El componente ${slot} no es válido.` };
    }
    normalized[slot] = id;
    ids.push(id);
  }

  const storage = input.storage;
  if (storage != null) {
    if (
      !Array.isArray(storage) ||
      storage.length > MAX_STORAGE_DEVICES ||
      storage.some(
        (id) => typeof id !== "string" || id.trim().length === 0 || id.length > 128,
      )
    ) {
      return {
        success: false,
        error: `Puedes guardar hasta ${MAX_STORAGE_DEVICES} unidades de almacenamiento.`,
      };
    }
    normalized.storage = storage as string[];
    ids.push(...normalized.storage);
  }

  if (ids.length === 0) {
    return { success: false, error: "Agrega al menos un componente antes de guardar." };
  }

  return { success: true, data: normalized, ids };
}

function resolveComponent(
  catalog: Map<string, PCComponent>,
  id: string,
  category: PCComponent["category"],
): PCComponent | null {
  const component = catalog.get(id);
  return component?.category === category ? component : null;
}

/** Save a build after resolving every ID against the trusted server-side catalog. */
export async function saveBuild(
  componentIds: BuildComponentIds,
): Promise<{ id: string } | { error: string }> {
  const normalized = normalizeComponentIds(componentIds);
  if (!normalized.success) return { error: normalized.error };

  try {
    const requestSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await requestSupabase.auth.getUser();
    // Authenticated writes stay on the request client so owner RLS is enforced.
    // Anonymous shared saves retain the existing server-only service-role path.
    const supabase = user ? requestSupabase : createSupabaseAdminClient();
    const uniqueIds = [...new Set(normalized.ids)];
    const productResult = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", uniqueIds)
      .eq("is_active", true);

    // Keep deploys functional while migration 002 is rolling out.
    let products: unknown[] | null = productResult.data;
    let fetchError = productResult.error;
    if (
      productResult.error?.code === "42703" &&
      productResult.error.message.includes("is_active")
    ) {
      const legacyResult = await supabase
        .from("products")
        .select(LEGACY_PRODUCT_SELECT)
        .in("id", uniqueIds);
      products = legacyResult.data;
      fetchError = legacyResult.error;
    }

    if (fetchError || !products) {
      console.error("Unable to validate build catalog IDs:", fetchError);
      return { error: "No pudimos validar los componentes seleccionados." };
    }

    const parsedProducts = products.map(parseProductRow);
    if (parsedProducts.some((component) => component === null)) {
      return { error: "Uno de los componentes tiene datos inválidos." };
    }

    const catalog = new Map(
      (parsedProducts as PCComponent[]).map((component) => [
        component.id,
        component,
      ]),
    );
    if (catalog.size !== uniqueIds.length) {
      return { error: "Uno o más componentes ya no están disponibles." };
    }

    if ([...catalog.values()].some((component) => component.inStock === false)) {
      return { error: "Uno o más componentes están sin stock." };
    }

    const build: BuildSelection = { storage: [] };
    for (const slot of SINGLE_SLOTS) {
      const id = normalized.data[slot];
      if (!id) continue;
      const component = resolveComponent(catalog, id, slot);
      if (!component) {
        return { error: `El componente seleccionado para ${slot} no es válido.` };
      }
      Object.assign(build, { [slot]: component });
    }

    for (const id of normalized.data.storage ?? []) {
      const component = resolveComponent(catalog, id, "storage");
      if (!component || component.category !== "storage") {
        return { error: "Una unidad de almacenamiento no es válida." };
      }
      build.storage.push(component);
    }

    const { data, error } = await supabase
      .from("saved_builds")
      .insert({
        ...(user ? { user_id: user.id } : {}),
        build_data: build,
        total_price: calculateBuildPrice(build),
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("Unable to persist shared build:", error);
      return { error: "No pudimos guardar la configuración." };
    }

    return { id: data.id };
  } catch (error) {
    console.error("Unexpected shared build error:", error);
    return { error: "El servicio de builds compartidas no está disponible." };
  }
}
