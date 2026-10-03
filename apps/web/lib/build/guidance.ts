import { evaluateBuild } from "@/lib/compatibility/engine";
import { COMPONENT_CATEGORIES, type ComponentCategory } from "@/lib/categories";
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

export type CategoryBudgetStatus = "unselected" | "within" | "over" | "under";

export interface CategoryBudgetBreakdown {
  category: ComponentCategory;
  target: number;
  spent: number;
  difference: number;
  status: CategoryBudgetStatus;
}

export interface BuildBudgetBreakdown {
  budget: number;
  totalTarget: number;
  totalSpent: number;
  difference: number;
  categories: CategoryBudgetBreakdown[];
  withinTargetCount: number;
  overTargetCategories: ComponentCategory[];
  unselectedCategories: ComponentCategory[];
}

export interface GuidedCandidateRanking {
  component: PCComponent;
  score: number;
  reasons: string[];
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
  const weights = getGuidedStrategy(profile).weights;
  const allocations = COMPONENT_CATEGORIES.map((item, index) => {
    const raw = profile.budget * weights[item];
    return { category: item, value: Math.floor(raw), fraction: raw % 1, index };
  });
  let remainder = profile.budget - allocations.reduce((total, item) => total + item.value, 0);

  for (const allocation of [...allocations].sort(
    (left, right) => right.fraction - left.fraction || left.index - right.index,
  )) {
    if (remainder <= 0) break;
    allocation.value += 1;
    remainder -= 1;
  }

  return allocations.find((allocation) => allocation.category === category)?.value ?? 0;
}

function getCategorySpend(build: BuildSelection, category: ComponentCategory): number {
  if (category === "storage") {
    return build.storage.reduce((total, component) => total + component.price, 0);
  }

  return build[category]?.price ?? 0;
}

export function getCategoryBudgetStatus(
  profile: GuidedProfile,
  build: BuildSelection,
  category: ComponentCategory,
): CategoryBudgetBreakdown {
  const target = getCategoryBudget(profile, category);
  const spent = getCategorySpend(build, category);
  const selected = category === "storage" ? build.storage.length > 0 : build[category] != null;
  const status: CategoryBudgetStatus = !selected
    ? "unselected"
    : spent > target
      ? "over"
      : spent >= target * 0.85
        ? "within"
        : "under";

  return {
    category,
    target,
    spent,
    difference: spent - target,
    status,
  };
}

export function getBuildBudgetBreakdown(
  profile: GuidedProfile,
  build: BuildSelection,
): BuildBudgetBreakdown {
  const categories = COMPONENT_CATEGORIES.map((category) =>
    getCategoryBudgetStatus(profile, build, category),
  );
  const totalSpent = categories.reduce((total, category) => total + category.spent, 0);

  return {
    budget: profile.budget,
    totalTarget: categories.reduce((total, category) => total + category.target, 0),
    totalSpent,
    difference: totalSpent - profile.budget,
    categories,
    withinTargetCount: categories.filter((category) => category.status === "within").length,
    overTargetCategories: categories
      .filter((category) => category.status === "over")
      .map((category) => category.category),
    unselectedCategories: categories
      .filter((category) => category.status === "unselected")
      .map((category) => category.category),
  };
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

function formatClp(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

function getBudgetReason(profile: GuidedProfile, candidate: PCComponent): string {
  const target = Math.max(getCategoryBudget(profile, candidate.category), 1);
  const ratio = candidate.price / target;

  if (profile.priority === "save" && candidate.price <= target) {
    return candidate.price < target
      ? `Queda por debajo del objetivo de ${formatClp(target)} y priorizaste ahorrar.`
      : `Queda dentro del objetivo de ${formatClp(target)} y priorizaste ahorrar.`;
  }

  if (profile.priority === "performance" && ratio >= 0.85 && ratio <= 1.35) {
    return `Su precio está dentro del margen usado al priorizar rendimiento sobre el objetivo de ${formatClp(target)}.`;
  }

  if (Math.abs(1 - ratio) <= 0.15) {
    return `Está cerca del objetivo de ${formatClp(target)} para esta categoría.`;
  }

  return candidate.price < target
    ? `Queda por debajo del objetivo de ${formatClp(target)} para esta categoría.`
    : `Supera el objetivo aproximado de ${formatClp(target)} para esta categoría.`;
}

function getSpecReasons(profile: GuidedProfile, candidate: PCComponent): string[] {
  if (!candidate.specs) return [];

  switch (candidate.category) {
    case "cpu": {
      const reasons: string[] = [];
      if (candidate.specs.cores) reasons.push(`Incluye ${candidate.specs.cores} núcleos.`);
      if (
        candidate.specs.hasIntegratedGraphics &&
        (profile.useCase === "work-study" || profile.useCase === "general")
      ) {
        reasons.push("Tiene gráficos integrados, una señal considerada para este perfil.");
      }
      return reasons;
    }
    case "gpu":
      return candidate.specs.vram ? [`Cuenta con ${candidate.specs.vram} GB de VRAM.`] : [];
    case "ram": {
      const capacity = candidate.specs.modules * candidate.specs.capacityPerModule;
      return capacity > 0 ? [`Incluye ${capacity} GB de RAM.`] : [];
    }
    case "storage": {
      const capacity = candidate.specs.capacity;
      if (candidate.specs.type === "nvme" && capacity >= 1000) {
        const capacityLabel = capacity % 1000 === 0
          ? `${capacity / 1000} TB`
          : `${capacity.toLocaleString("es-CL")} GB`;
        return [`Usa NVMe y ofrece ${capacityLabel}.`];
      }
      if (candidate.specs.type === "nvme") return ["Usa interfaz NVMe."];
      return capacity >= 1000
        ? [`Ofrece ${capacity.toLocaleString("es-CL")} GB de almacenamiento.`]
        : [];
    }
    default:
      return [];
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
export function rankGuidedCandidateDetails(
  profile: GuidedProfile,
  build: BuildSelection,
  catalog: PCComponent[],
  category: ComponentCategory,
): GuidedCandidateRanking[] {
  return catalog
    .filter(
      (candidate) =>
        candidate.category === category &&
        candidate.inStock !== false &&
        isCompatibleCandidate(build, category, candidate),
    )
    .map((component) => ({
      component,
      score:
        getBudgetScore(profile, component) +
        getSpecScore(profile, component) *
          (profile.priority === "performance"
            ? 1
            : profile.priority === "balanced"
              ? 0.7
              : 0.35),
      reasons: [
        getBudgetReason(profile, component),
        ...getSpecReasons(profile, component),
        "No genera incompatibilidades con tu configuración actual.",
        "Está en stock.",
      ],
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.component.price - right.component.price ||
        left.component.id.localeCompare(right.component.id),
    );
}

export function rankGuidedCandidates(
  profile: GuidedProfile,
  build: BuildSelection,
  catalog: PCComponent[],
  category: ComponentCategory,
): PCComponent[] {
  return rankGuidedCandidateDetails(profile, build, catalog, category).map(
    ({ component }) => component,
  );
}
