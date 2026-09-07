"use client";

/**
 * Global store for the PC Builder configurator.
 *
 * Manages the current build selection and exposes derived state
 * (compatibility report, total price) as computed getters.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { evaluateBuild } from "@/lib/compatibility/engine";
import { calculateBuildPrice } from "@/lib/build/totals";
import {
  parseBuildSelection,
  reconcileBuildWithCatalog,
} from "@/lib/components/validation";
import { saveBuild } from "@/app/actions/saveBuild";
import type {
  BuildSelection,
  BuildCompatibilityReport,
  PCComponent,
  StorageComponent,
} from "@/types/component";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Slot categories that hold a single component (everything except storage). */
type SingleSlot = Exclude<keyof BuildSelection, "storage">;

interface BuildActions {
  /** Set (or replace) a single-slot component. */
  setComponent: (category: SingleSlot, component: PCComponent) => void;
  /** Remove a single-slot component. */
  removeComponent: (category: SingleSlot) => void;

  /** Add a storage device to the build. */
  addStorage: (device: StorageComponent) => void;
  /** Remove a storage device by id. */
  removeStorage: (deviceId: string) => void;

  /** Reset the entire build to its initial empty state. */
  clearBuild: () => void;
  
  /** Load an entire build from data */
  loadBuild: (build: BuildSelection) => void;
  /** Refresh persisted component snapshots with current catalog records. */
  reconcileCatalog: (catalog: PCComponent[]) => void;

  /** Run the compatibility engine against the current build. */
  getCompatibilityReport: () => BuildCompatibilityReport;
  /** Sum of all selected components' prices (CLP). */
  getTotalPrice: () => number;
  
  /** Save the current build via Server Action and return the generated ID */
  saveBuildToCloud: () => Promise<string | null>;
}

interface BuildState {
  build: BuildSelection;
}

export type BuildStore = BuildState & BuildActions;

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const EMPTY_BUILD: BuildSelection = {
  cpu: undefined,
  motherboard: undefined,
  ram: undefined,
  gpu: undefined,
  storage: [],
  case: undefined,
  cooler: undefined,
  psu: undefined,
};

function createEmptyBuild(): BuildSelection {
  return { ...EMPTY_BUILD, storage: [] };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBuildStore = create<BuildStore>()(
  persist(
    (set, get) => ({
  build: createEmptyBuild(),

  // -- Mutations -------------------------------------------------------------

  setComponent: (category, component) =>
    set((state) => ({
      build: { ...state.build, [category]: component },
    })),

  removeComponent: (category) =>
    set((state) => ({
      build: { ...state.build, [category]: undefined },
    })),

  addStorage: (device) =>
    set((state) => ({
      build: {
        ...state.build,
        storage: [...state.build.storage, device],
      },
    })),

  removeStorage: (deviceId) =>
    set((state) => {
      const index = state.build.storage.findIndex((device) => device.id === deviceId);
      if (index < 0) return state;
      return {
        build: {
          ...state.build,
          storage: state.build.storage.filter((_, itemIndex) => itemIndex !== index),
        },
      };
    }),

  clearBuild: () =>
    set({ build: createEmptyBuild() }),

  loadBuild: (build) => {
    const parsed = parseBuildSelection(build);
    if (parsed) set({ build: parsed });
  },

  reconcileCatalog: (catalog) =>
    set((state) => ({
      build: reconcileBuildWithCatalog(state.build, catalog),
    })),

  // -- Derived state (computed on demand) ------------------------------------

  getCompatibilityReport: () => evaluateBuild(get().build),

  getTotalPrice: () => calculateBuildPrice(get().build),

  saveBuildToCloud: async () => {
    const { build } = get();

    // Extract component IDs to send to Server Action
    const componentIds: Record<string, string | string[] | undefined> = {
      cpu: build.cpu?.id,
      motherboard: build.motherboard?.id,
      ram: build.ram?.id,
      gpu: build.gpu?.id,
      case: build.case?.id,
      cooler: build.cooler?.id,
      psu: build.psu?.id,
      storage: build.storage.map((s) => s.id),
    };

    // Call Server Action (recalculates price server-side)
    const result = await saveBuild(componentIds);

    if ("error" in result) {
      throw new Error(result.error);
    }

    return result.id;
  },
    }),
    {
      name: "nexbuild-active-build",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ build: state.build }),
      migrate: (persistedState) => {
        const persisted = persistedState as { build?: unknown } | null;
        return {
          build: parseBuildSelection(persisted?.build) ?? createEmptyBuild(),
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { build?: unknown } | null;
        return {
          ...currentState,
          build: parseBuildSelection(persisted?.build) ?? createEmptyBuild(),
        };
      },
    },
  ),
);
