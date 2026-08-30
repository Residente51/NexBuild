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

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBuildStore = create<BuildStore>()(
  persist(
    (set, get) => ({
  build: { ...EMPTY_BUILD },

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
    set((state) => ({
      build: {
        ...state.build,
        storage: state.build.storage.filter((d) => d.id !== deviceId),
      },
    })),

  clearBuild: () =>
    set({ build: { ...EMPTY_BUILD, storage: [] } }),

  loadBuild: (build) => set({ build }),

  // -- Derived state (computed on demand) ------------------------------------

  getCompatibilityReport: () => evaluateBuild(get().build),

  getTotalPrice: () => {
    const { build } = get();
    let total = 0;

    if (build.cpu) total += build.cpu.price;
    if (build.motherboard) total += build.motherboard.price;
    if (build.ram) total += build.ram.price;
    if (build.gpu) total += build.gpu.price;
    if (build.case) total += build.case.price;
    if (build.cooler) total += build.cooler.price;
    if (build.psu) total += build.psu.price;

    for (const device of build.storage) {
      total += device.price;
    }

    return total;
  },

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
      partialize: (state) => ({ build: state.build }),
    },
  ),
);
