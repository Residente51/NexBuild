import { describe, expect, it } from "vitest";
import {
  getCategoryBudget,
  getGuidedStrategy,
  getNextRecommendedCategory,
  rankGuidedCandidates,
  type GuidedProfile,
} from "@/lib/build/guidance";
import type {
  BuildSelection,
  CPUComponent,
  GPUComponent,
  MotherboardComponent,
  PCComponent,
} from "@/types/component";

const emptyBuild = (): BuildSelection => ({ storage: [] });

const profile = (
  overrides: Partial<GuidedProfile> = {},
): GuidedProfile => ({
  useCase: "gaming",
  budget: 1_000_000,
  priority: "balanced",
  ...overrides,
});

function cpu(id: string, price: number, cores: number, socket = "AM5"): CPUComponent {
  return {
    id,
    slug: id,
    name: id,
    brand: "Test",
    category: "cpu",
    price,
    specs: {
      socket,
      tdp: 65,
      hasIntegratedGraphics: false,
      includesCooler: true,
      cores,
    },
  };
}

function gpu(id: string, price: number, vram: number): GPUComponent {
  return {
    id,
    slug: id,
    name: id,
    brand: "Test",
    category: "gpu",
    price,
    specs: {
      length: 250,
      slotWidth: 2,
      recommendedPsuWattage: 550,
      vram,
    },
  };
}

function motherboard(id: string, socket: string): MotherboardComponent {
  return {
    id,
    slug: id,
    name: id,
    brand: "Test",
    category: "motherboard",
    price: 150_000,
    specs: {
      socket,
      formFactor: "ATX",
      ramType: "ddr5",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
    },
  };
}

describe("guided builder strategy", () => {
  it("distributes the profile budget and splits Case/Cooling deterministically", () => {
    const strategy = getGuidedStrategy(profile());
    const totalWeight = Object.values(strategy.weights).reduce((total, weight) => total + weight, 0);

    expect(totalWeight).toBeCloseTo(1);
    expect(getCategoryBudget(profile(), "gpu")).toBe(380_000);
    expect(getCategoryBudget(profile(), "case")).toBe(56_000);
    expect(getCategoryBudget(profile(), "cooler")).toBe(24_000);
    expect(getCategoryBudget(profile({ useCase: "programming" }), "cpu")).toBe(270_000);
  });

  it("chooses the next missing category in a deterministic profile order", () => {
    const gaming = profile();
    const build = emptyBuild();

    expect(getNextRecommendedCategory(gaming, build)).toBe("cpu");
    build.cpu = cpu("selected-cpu", 200_000, 6);
    expect(getNextRecommendedCategory(gaming, build)).toBe("gpu");
    build.gpu = gpu("selected-gpu", 350_000, 8);
    expect(getNextRecommendedCategory(gaming, build)).toBe("motherboard");
  });
});

describe("guided candidate ranking", () => {
  it("excludes a candidate that introduces an incompatibility", () => {
    const build = emptyBuild();
    build.cpu = cpu("am5-cpu", 200_000, 6, "AM5");
    const compatible = motherboard("am5-board", "AM5");
    const incompatible = motherboard("am4-board", "AM4");

    expect(
      rankGuidedCandidates(profile(), build, [incompatible, compatible], "motherboard")
        .map((candidate) => candidate.id),
    ).toEqual(["am5-board"]);
  });

  it("changes CPU order between gaming and programming profiles", () => {
    const catalog = [
      cpu("balanced-cpu", 200_000, 6),
      cpu("more-cores", 270_000, 12),
    ];

    expect(rankGuidedCandidates(profile(), emptyBuild(), catalog, "cpu")[0]?.id).toBe("balanced-cpu");
    expect(
      rankGuidedCandidates(
        profile({ useCase: "programming" }),
        emptyBuild(),
        catalog,
        "cpu",
      )[0]?.id,
    ).toBe("more-cores");
  });

  it("applies performance, balanced and save priorities differently", () => {
    const catalog = [
      gpu("economical", 250_000, 4),
      gpu("on-target", 380_000, 8),
      gpu("above-target", 480_000, 10),
    ];

    expect(
      rankGuidedCandidates(profile({ priority: "performance" }), emptyBuild(), catalog, "gpu")[0]?.id,
    ).toBe("above-target");
    expect(
      rankGuidedCandidates(profile({ priority: "balanced" }), emptyBuild(), catalog, "gpu")[0]?.id,
    ).toBe("on-target");
    expect(
      rankGuidedCandidates(profile({ priority: "save" }), emptyBuild(), catalog, "gpu")[0]?.id,
    ).toBe("economical");
  });

  it("falls back to budget and stable ordering when specs are unavailable", () => {
    const catalog: PCComponent[] = [
      { ...cpu("unknown-expensive", 260_000, 0), specs: undefined },
      { ...cpu("unknown-target", 200_000, 0), specs: undefined },
    ];

    expect(rankGuidedCandidates(profile(), emptyBuild(), catalog, "cpu")[0]?.id).toBe("unknown-target");
  });

  it("does not mutate the original build while simulating candidates", () => {
    const build = emptyBuild();
    const snapshot = structuredClone(build);

    rankGuidedCandidates(profile(), build, [gpu("candidate", 380_000, 8)], "gpu");

    expect(build).toEqual(snapshot);
  });

  it("returns an empty fallback when no in-stock compatible candidate exists", () => {
    const unavailable = { ...gpu("unavailable", 380_000, 8), inStock: false };

    expect(rankGuidedCandidates(profile(), emptyBuild(), [unavailable], "gpu")).toEqual([]);
  });
});
