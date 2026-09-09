import type { ComponentCategory } from "@/lib/categories";
import type { BuildSelection } from "@/types/component";

const ALWAYS_REQUIRED: ComponentCategory[] = [
  "cpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "case",
];

export interface BuildProgress {
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
  requiredCategories: ComponentCategory[];
  missingCategories: ComponentCategory[];
}

function hasSelection(build: BuildSelection, category: ComponentCategory) {
  return category === "storage"
    ? build.storage.length > 0
    : build[category] != null;
}

/** Mirrors the compatibility engine's required-part semantics. */
export function getBuildProgress(build: BuildSelection): BuildProgress {
  const requiredCategories = [...ALWAYS_REQUIRED];

  if (build.cpu?.specs?.hasIntegratedGraphics === false) {
    requiredCategories.splice(3, 0, "gpu");
  }

  if (build.cpu?.specs?.includesCooler === false) {
    requiredCategories.splice(requiredCategories.length - 2, 0, "cooler");
  }

  const missingCategories = requiredCategories.filter(
    (category) => !hasSelection(build, category),
  );
  const total = requiredCategories.length;
  const completed = total - missingCategories.length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
    isComplete: missingCategories.length === 0,
    requiredCategories,
    missingCategories,
  };
}
