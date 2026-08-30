"use server";

import { components } from "@/data/components";
import { supabase } from "@/lib/supabaseClient";
import type { BuildSelection, PCComponent } from "@/types/component";

/**
 * Server Action: Save a build by component IDs only.
 *
 * Validates user auth, reconstructs full build data server-side by
 * cross-referencing the catalog, recalculates total_price immutably,
 * and persists to Supabase under RLS protection.
 *
 * Client never sends prices or manipulates totals.
 */
export async function saveBuild(
  componentIds: Record<string, string | string[] | undefined>
): Promise<{ id: string } | { error: string }> {
  try {
    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Build the full selection by resolving IDs against catalog
    const build: BuildSelection = {
      cpu: undefined,
      motherboard: undefined,
      ram: undefined,
      gpu: undefined,
      storage: [],
      case: undefined,
      cooler: undefined,
      psu: undefined,
    };

    // Helper to find component by ID
    const findComponent = (id: string): PCComponent | undefined => {
      return components.find((c) => c.id === id);
    };

    // Resolve single-slot components
    if (componentIds.cpu) {
      const comp = findComponent(componentIds.cpu as string);
      if (comp && comp.category === "cpu") build.cpu = comp;
    }

    if (componentIds.motherboard) {
      const comp = findComponent(componentIds.motherboard as string);
      if (comp && comp.category === "motherboard") build.motherboard = comp;
    }

    if (componentIds.ram) {
      const comp = findComponent(componentIds.ram as string);
      if (comp && comp.category === "ram") build.ram = comp;
    }

    if (componentIds.gpu) {
      const comp = findComponent(componentIds.gpu as string);
      if (comp && comp.category === "gpu") build.gpu = comp;
    }

    if (componentIds.case) {
      const comp = findComponent(componentIds.case as string);
      if (comp && comp.category === "case") build.case = comp;
    }

    if (componentIds.cooler) {
      const comp = findComponent(componentIds.cooler as string);
      if (comp && comp.category === "cooler") build.cooler = comp;
    }

    if (componentIds.psu) {
      const comp = findComponent(componentIds.psu as string);
      if (comp && comp.category === "psu") build.psu = comp;
    }

    // Resolve storage (array of IDs)
    if (componentIds.storage && Array.isArray(componentIds.storage)) {
      for (const storageId of componentIds.storage) {
        const comp = findComponent(storageId as string);
        if (comp && comp.category === "storage") {
          build.storage.push(comp);
        }
      }
    }

    // Recalculate total_price immutably server-side
    let totalPrice = 0;

    if (build.cpu) totalPrice += build.cpu.price;
    if (build.motherboard) totalPrice += build.motherboard.price;
    if (build.ram) totalPrice += build.ram.price;
    if (build.gpu) totalPrice += build.gpu.price;
    if (build.case) totalPrice += build.case.price;
    if (build.cooler) totalPrice += build.cooler.price;
    if (build.psu) totalPrice += build.psu.price;

    for (const device of build.storage) {
      totalPrice += device.price;
    }

    // Insert into Supabase with user_id set server-side
    const { data, error } = await supabase
      .from("saved_builds")
      .insert({
        user_id: userId,
        build_data: build,
        total_price: totalPrice,
      })
      .select("id")
      .single();

    if (error) {
      return { error: error.message };
    }

    return { id: data?.id || "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}
