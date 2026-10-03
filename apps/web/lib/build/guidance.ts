import { evaluateBuild } from "@/lib/compatibility/engine";
import type { ComponentCategory } from "@/lib/categories";
import type { BuildSelection, PCComponent } from "@/types/component";

export const GUIDED_USE_CASES = [
  "gaming",
  "programming",
  "work-study",
  "content-creation",
  "local-ai",
  "general",
] as const;

export const GUIDED_PRIORITIES = ["performance", "balanced", "save"] as const;

export type GuidedUseCase = (typeof GUIDED_USE_CASES)[number];
export type GuidedPriority = (typeof GUIDED_PRIORITIES)[number];

export const GUIDED_USE_CASE_LABELS: Record<GuidedUseCase, string> = {
  gaming: "Gaming",
  programming: "Programación",
  "work-study": "Trabajo / estudio",
  "content-creation": "Edición / creación",
  "local-ai": "IA local",
  general: "Uso general",
};

export const GUIDED_PRIORITY_LABELS: Record<GuidedPriority, string> = {
  performance: "Máximo rendimiento",
  balanced: "Equilibrio",
  save: "Ahorrar",
};

export interface GuidedProfile {
  useCase: GuidedUseCase;
  budget: number;
  priority: GuidedPriority;
}

export interface GuidedStrategy {
  weights: Record<ComponentCategory, number>;
  categoryOrder: ComponentCategory[];
}

const BASE_WEIGHTS: Record<
  GuidedUseCase,
  Omit<Record<ComponentCategory, number>, "case" | "cooler"> & {
    caseCooling: number;
  }
> = {
  gaming: {
    cpu: 0.2,
    gpu: 0.38,
    ram: 0.09,
    storage: 0.08,
    motherboard: 0.1,
    psu: 0.07,
    caseCooling: 0.08,
  },
  programming: {
    cpu: 0.27,
    gpu: 0.06,
    ram: 0.17,
    storage: 0.14,
    motherboard: 0.13,
    psu: 0.07,
    caseCooling: 0.16,
  },
  "work-study": {
    cpu: 0.24,
    gpu: 0.03,
    ram: 0.15,
    storage: 0.17,
    motherboard: 0.14,
    psu: 0.08,
    caseCooling: 0.19,
  },
  "content-creation": {
    cpu: 0.25,
    gpu: 0.25,
    ram: 0.14,
    storage: 0.12,
    motherboard: 0.1,
    psu: 0.07,
    caseCooling: 0.07,
  },
  "local-ai": {
    cpu: 0.16,
    gpu: 0.42,
    ram: 0.13,
    storage: 0.09,
    motherboard: 0.08,
    psu: 0.07,
    caseCooling: 0.05,
  },
  general: {
    cpu: 0.22,
    gpu: 0.18,
    ram: 0.13,
    storage: 0.12,
    motherboard: 0.12,
    psu: 0.08,
    caseCooling: 0.15,
  },
};

const CATEGORY_ORDERS: Record<GuidedUseCase, ComponentCategory[]> = {
  gaming: ["cpu", "gpu", "motherboard", "ram", "storage", "psu", "case", "cooler"],
  programming: ["cpu", "motherboard", "ram", "storage", "gpu", "psu", "case", "cooler"],
  "work-study": ["cpu", "motherboard", "ram", "storage", "psu", "case", "cooler", "gpu"],
  "content-creation": ["cpu", "gpu", "motherboard", "ram", "storage", "psu", "case", "cooler"],
  "local-ai": ["gpu", "cpu", "motherboard", "ram", "storage", "psu", "case", "cooler"],
  general: ["cpu", "motherboard", "ram", "storage", "gpu", "psu", "case", "cooler"],
};

export function getGuidedStrategy(profile: GuidedProfile): GuidedStrategy {
  const base = BASE_WEIGHTS[profile.useCase];

  return {
    weights: {
      cpu: base.cpu,
      gpu: base.gpu,
      ram: base.ram,
      storage: base.storage,
      motherboard: base.motherboard,
      psu: base.psu,
      // The shared Case/Cooling allocation is split consistently: 70% for the
      // case and 30% for cooling. These remain guidance targets, never limits.
      case: base.caseCooling * 0.7,
      cooler: base.caseCooling * 0.3,
    },
    categoryOrder: [...CATEGORY_ORDERS[profile.useCase]],
  };
}

export function getCategoryBudget(
  profile: GuidedProfile,
  category: ComponentCategory,
): number {
  return Math.round(profile.budget * getGuidedStrategy(profile).weights[category]);
}

export function getNextRecommendedCategory(
  profile: GuidedProfile,
  build: BuildSelection,
): ComponentCategory | null {
  return (
    getGuidedStrategy(profile).categoryOrder.find((category) => {
      if (category === "storage") return build.storage.length === 0;
      return build[category] == null;
    }) ?? null
  );
}

function withCandidate(
  build: BuildSelection,
  category: ComponentCategory,
  candidate: PCComponent,
): BuildSelection {
  if (category === "storage") {
    return { ...build, storage: [...build.storage, candidate as BuildSelection["storage"][number]] };
  }

  return { ...build, [category]: candidate };
}

function isCompatibleCandidate(
  build: BuildSelection,
  category: ComponentCategory,
  candidate: PCComponent,
): boolean {
  const simulated = withCandidate(build, category, candidate);
  const existingIncompatibilities = new Set(
    evaluateBuild(build).issues
      .filter((issue) => issue.status === "incompatible")
      .map((issue) => issue.code),
  );

  return !evaluateBuild(simulated).issues.some(
    (issue) =>
      issue.status === "incompatible" &&
      (issue.componentCategories.includes(category) ||
        !existingIncompatibilities.has(issue.code)),
  );
}

function getSpecScore(profile: GuidedProfile, candidate: PCComponent): number {
  const useCase = profile.useCase;

  switch (candidate.category) {
    case "cpu": {
      const cores = candidate.specs?.cores ?? 0;
      const coreWeight = useCase === "programming" || useCase === "content-creation" ? 3 : 1.5;
      const integratedGraphics = candidate.specs?.hasIntegratedGraphics
        && (useCase === "work-study" || useCase === "general")
        ? 18
        : 0;
      return Math.min(cores * coreWeight, 30) + integratedGraphics;
    }
    case "gpu": {
      const vram = candidate.specs?.vram ?? 0;
      if (useCase === "local-ai") return Math.min(vram * 4, 48);
      if (useCase === "gaming" || useCase === "content-creation") return Math.min(vram * 2.5, 35);
      return Math.min(vram, 12);
    }
    case "ram": {
      const capacity = candidate.specs
        ? candidate.specs.modules * candidate.specs.capacityPerModule
        : 0;
      const target = useCase === "programming" || useCase === "content-creation" || useCase === "local-ai"
        ? 32
        : 16;
      return Math.min((capacity / target) * 28, 36);
    }
    case "storage": {
      const nvme = candidate.specs?.type === "nvme" ? 16 : 0;
      const capacity = (candidate.specs?.capacity ?? 0) >= 1000 ? 14 : 0;
      return nvme + capacity;
    }
    default:
      return 0;
  }
}

function getBudgetScore(profile: GuidedProfile, candidate: PCComponent): number {
  const target = Math.max(getCategoryBudget(profile, candidate.category), 1);
  const ratio = candidate.price / target;

  if (profile.priority === "performance") {
    if (ratio <= 1.35) return 30 - Math.abs(1.1 - ratio) * 18;
    return Math.max(0, 18 - (ratio - 1.35) * 25);
  }

  if (profile.priority === "save") {
    if (ratio <= 1) return 36 - ratio * 12;
    return Math.max(0, 16 - (ratio - 1) * 35);
  }

  return Math.max(0, 32 - Math.abs(1 - ratio) * 32);
}

/**
 * Returns only in-stock, compatible candidates in deterministic guided order.
 * Callers may append the remaining category catalog to preserve manual choice.
 */
export function rankGuidedCandidates(
  profile: GuidedProfile,
  build: BuildSelection,
  catalog: PCComponent[],
  category: ComponentCategory,
): PCComponent[] {
  return catalog
    .filter(
      (candidate) =>
        candidate.category === category &&
        candidate.inStock !== false &&
        isCompatibleCandidate(build, category, candidate),
    )
    .map((candidate) => ({
      candidate,
      score:
        getBudgetScore(profile, candidate) +
        getSpecScore(profile, candidate) *
          (profile.priority === "performance"
            ? 1
            : profile.priority === "balanced"
              ? 0.7
              : 0.35),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.candidate.price - right.candidate.price ||
        left.candidate.id.localeCompare(right.candidate.id),
    )
    .map(({ candidate }) => candidate);
}
