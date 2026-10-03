import { describe, expect, it } from "vitest";
import {
  getBuildBudgetBreakdown,
  getCategoryBudget,
  getCategoryBudgetStatus,
  getGuidedStrategy,
  getNextRecommendedCategory,
  rankGuidedCandidateDetails,
  rankGuidedCandidates,
  type GuidedProfile,
} from "@/lib/build/guidance";
import type {
  BuildSelection,
  CPUComponent,
  GPUComponent,
  MotherboardComponent,
  PCComponent,
  RAMComponent,
  StorageComponent,
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

function cpu(
  id: string,
  price: number,
  cores: number,
  socket = "AM5",
  hasIntegratedGraphics = false,
): CPUComponent {
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
      hasIntegratedGraphics,
      includesCooler: true,
      cores,
    },
  };
}

function ram(id: string, price: number, capacity: number): RAMComponent {
  return {
    id,
    slug: id,
    name: id,
    brand: "Test",
    category: "ram",
    price,
    specs: {
      ramType: "ddr5",
      modules: 2,
      capacityPerModule: capacity / 2,
    },
  };
}

function storage(
  id: string,
  price: number,
  capacity: number,
  type: "nvme" | "sata" = "nvme",
): StorageComponent {
  return {
    id,
    slug: id,
    name: id,
    brand: "Test",
    category: "storage",
    price,
    specs: {
      type,
      formFactor: type === "nvme" ? "m.2 2280" : "2.5",
      capacity,
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

  it("calculates category spend, including multiple storage devices", () => {
    const build = emptyBuild();
    build.cpu = cpu("selected-cpu", 180_000, 6);
    build.storage = [
      storage("primary", 60_000, 1000),
      storage("secondary", 40_000, 1000, "sata"),
    ];

    expect(getCategoryBudgetStatus(profile(), build, "cpu").spent).toBe(180_000);
    expect(getCategoryBudgetStatus(profile(), build, "storage").spent).toBe(100_000);
    expect(getCategoryBudgetStatus(profile(), build, "gpu").spent).toBe(0);
  });

  it("classifies selected categories as within, over or under their target", () => {
    const within = emptyBuild();
    within.cpu = cpu("within", 180_000, 6);
    const over = emptyBuild();
    over.cpu = cpu("over", 210_000, 6);
    const under = emptyBuild();
    under.cpu = cpu("under", 120_000, 6);

    expect(getCategoryBudgetStatus(profile(), within, "cpu").status).toBe("within");
    expect(getCategoryBudgetStatus(profile(), over, "cpu").status).toBe("over");
    expect(getCategoryBudgetStatus(profile(), under, "cpu").status).toBe("under");
    expect(getCategoryBudgetStatus(profile(), emptyBuild(), "cpu").status).toBe("unselected");
  });

  it("keeps the category targets and total spend consistent with the profile budget", () => {
    const customProfile = profile({ budget: 1_000_003 });
    const build = emptyBuild();
    build.cpu = cpu("selected-cpu", 200_000, 6);
    build.storage = [storage("primary", 80_000, 1000)];
    const breakdown = getBuildBudgetBreakdown(customProfile, build);

    expect(breakdown.totalTarget).toBe(customProfile.budget);
    expect(breakdown.totalSpent).toBe(280_000);
    expect(breakdown.difference).toBe(280_000 - customProfile.budget);
    expect(breakdown.unselectedCategories).not.toContain("storage");
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

  it("explains budget scoring for performance, balanced and save priorities", () => {
    const candidate = gpu("candidate", 380_000, 8);
    const getBudgetReason = (priority: GuidedProfile["priority"]) =>
      rankGuidedCandidateDetails(profile({ priority }), emptyBuild(), [candidate], "gpu")[0]
        ?.reasons[0];

    expect(getBudgetReason("performance")).toContain("priorizar rendimiento");
    expect(getBudgetReason("balanced")).toContain("cerca del objetivo");
    expect(getBudgetReason("save")).toContain("priorizaste ahorrar");
  });

  it("only adds the iGPU reason when the data exists and the profile uses that signal", () => {
    const integrated = cpu("integrated", 240_000, 6, "AM5", true);
    const withoutIntegrated = cpu("without-integrated", 240_000, 6);
    const workProfile = profile({ useCase: "work-study" });

    expect(
      rankGuidedCandidateDetails(workProfile, emptyBuild(), [integrated], "cpu")[0]?.reasons,
    ).toContain("Tiene gráficos integrados, una señal considerada para este perfil.");
    expect(
      rankGuidedCandidateDetails(profile(), emptyBuild(), [integrated], "cpu")[0]?.reasons,
    ).not.toContain("Tiene gráficos integrados, una señal considerada para este perfil.");
    expect(
      rankGuidedCandidateDetails(workProfile, emptyBuild(), [withoutIntegrated], "cpu")[0]?.reasons
        .some((reason) => reason.includes("gráficos integrados")),
    ).toBe(false);
  });

  it("derives RAM, NVMe capacity and VRAM reasons only from available specs", () => {
    const ramReasons = rankGuidedCandidateDetails(
      profile({ useCase: "programming" }),
      emptyBuild(),
      [ram("ram-32", 130_000, 32)],
      "ram",
    )[0]?.reasons;
    const storageReasons = rankGuidedCandidateDetails(
      profile(),
      emptyBuild(),
      [storage("nvme-1tb", 80_000, 1000)],
      "storage",
    )[0]?.reasons;
    const gpuReasons = rankGuidedCandidateDetails(
      profile(),
      emptyBuild(),
      [gpu("gpu-16", 380_000, 16)],
      "gpu",
    )[0]?.reasons;

    expect(ramReasons).toContain("Incluye 32 GB de RAM.");
    expect(storageReasons).toContain("Usa NVMe y ofrece 1 TB.");
    expect(gpuReasons).toContain("Cuenta con 16 GB de VRAM.");
  });

  it("does not invent specification reasons when specs are missing", () => {
    const candidate: PCComponent = { ...gpu("unknown", 380_000, 0), specs: undefined };
    const reasons = rankGuidedCandidateDetails(
      profile(),
      emptyBuild(),
      [candidate],
      "gpu",
    )[0]?.reasons ?? [];

    expect(reasons).toHaveLength(3);
    expect(reasons.join(" ")).not.toMatch(/VRAM|RAM|NVMe|gráficos|núcleos/);
    expect(reasons).toContain("No genera incompatibilidades con tu configuración actual.");
    expect(reasons).toContain("Está en stock.");
  });

  it("keeps reasons and ranking deterministic without mutating build or catalog", () => {
    const build = emptyBuild();
    const catalog = [gpu("first", 380_000, 8), gpu("second", 350_000, 6)];
    const buildSnapshot = structuredClone(build);
    const catalogSnapshot = structuredClone(catalog);

    const firstRun = rankGuidedCandidateDetails(profile(), build, catalog, "gpu");
    const secondRun = rankGuidedCandidateDetails(profile(), build, catalog, "gpu");

    expect(secondRun).toEqual(firstRun);
    expect(build).toEqual(buildSnapshot);
    expect(catalog).toEqual(catalogSnapshot);
  });
});
