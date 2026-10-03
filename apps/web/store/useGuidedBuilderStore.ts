"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GuidedPriority,
  GuidedProfile,
  GuidedUseCase,
} from "@/lib/build/guidance";

interface GuidedBuilderState extends GuidedProfile {
  enabled: boolean;
  configure: (profile: GuidedProfile) => void;
  disable: () => void;
}

export const useGuidedBuilderStore = create<GuidedBuilderState>()(
  persist(
    (set) => ({
      enabled: false,
      useCase: "gaming" as GuidedUseCase,
      budget: 1_000_000,
      priority: "balanced" as GuidedPriority,
      configure: (profile) => set({ ...profile, enabled: true }),
      disable: () => set({ enabled: false }),
    }),
    {
      name: "nexbuild-guided-builder",
      version: 1,
      skipHydration: true,
      partialize: ({ enabled, useCase, budget, priority }) => ({
        enabled,
        useCase,
        budget,
        priority,
      }),
    },
  ),
);
