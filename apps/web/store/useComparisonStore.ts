"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  COMPONENT_CATEGORIES,
  type ComponentCategory,
} from "@/lib/categories";

export const MAX_COMPARISON_ITEMS = 4;

export interface ComparisonReference {
  slug: string;
  category: ComponentCategory;
}

export type ComparisonAddResult =
  | { success: true }
  | {
      success: false;
      reason: "duplicate" | "mixed-category" | "limit";
    };

interface ComparisonStore {
  items: ComparisonReference[];
  addComponent: (component: ComparisonReference) => ComparisonAddResult;
  removeComponent: (slug: string) => void;
  clearComparison: () => void;
}

function isComponentCategory(value: unknown): value is ComponentCategory {
  return (
    typeof value === "string" &&
    (COMPONENT_CATEGORIES as readonly string[]).includes(value)
  );
}

function parsePersistedItems(value: unknown): ComparisonReference[] {
  if (!Array.isArray(value)) return [];

  const parsed: ComparisonReference[] = [];
  let category: ComponentCategory | undefined;

  for (const item of value) {
    if (parsed.length >= MAX_COMPARISON_ITEMS) break;
    if (typeof item !== "object" || item === null) continue;

    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.slug !== "string" ||
      candidate.slug.length === 0 ||
      candidate.slug.length > 200 ||
      !isComponentCategory(candidate.category)
    ) {
      continue;
    }

    if (category && candidate.category !== category) continue;
    if (parsed.some((entry) => entry.slug === candidate.slug)) continue;

    category ??= candidate.category;
    parsed.push({ slug: candidate.slug, category: candidate.category });
  }

  return parsed;
}

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      items: [],

      addComponent: (component) => {
        const { items } = get();

        if (items.some((item) => item.slug === component.slug)) {
          return { success: false, reason: "duplicate" };
        }

        if (
          items.length > 0 &&
          items[0].category !== component.category
        ) {
          return { success: false, reason: "mixed-category" };
        }

        if (items.length >= MAX_COMPARISON_ITEMS) {
          return { success: false, reason: "limit" };
        }

        set({ items: [...items, component] });
        return { success: true };
      },

      removeComponent: (slug) =>
        set((state) => ({
          items: state.items.filter((item) => item.slug !== slug),
        })),

      clearComparison: () => set({ items: [] }),
    }),
    {
      name: "nexbuild-comparison",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { items?: unknown } | null;
        return {
          ...currentState,
          items: parsePersistedItems(persisted?.items),
        };
      },
    },
  ),
);

let hydrationRequest: Promise<void> | null = null;

export function hydrateComparisonStore(): Promise<void> {
  if (useComparisonStore.persist.hasHydrated()) return Promise.resolve();

  hydrationRequest ??= Promise.resolve(
    useComparisonStore.persist.rehydrate(),
  ).finally(() => {
    hydrationRequest = null;
  });

  return hydrationRequest;
}
