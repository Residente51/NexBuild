import { evaluateBuild } from "@/lib/compatibility/engine";
import type {
  BuildSelection,
  CompatibilityIssue,
  CompatibilityStatus,
  PCComponent,
  StorageComponent,
} from "@/types/component";

export interface CandidateCompatibilityPreview {
  status: CompatibilityStatus;
  issues: CompatibilityIssue[];
}

export function getCandidateCompatibilityPreview(
  build: BuildSelection,
  candidate: PCComponent,
): CandidateCompatibilityPreview {
  const candidateBuild: BuildSelection =
    candidate.category === "storage"
      ? {
          ...build,
          storage: [...build.storage, candidate as StorageComponent],
        }
      : { ...build, [candidate.category]: candidate };
  const issues = evaluateBuild(candidateBuild).issues.filter((issue) =>
    issue.componentCategories.includes(candidate.category),
  );

  const status: CompatibilityStatus = issues.some(
    (issue) => issue.status === "incompatible",
  )
    ? "incompatible"
    : issues.some((issue) => issue.status === "warning")
      ? "warning"
      : issues.some((issue) => issue.status === "incomplete")
        ? "incomplete"
        : "compatible";

  return { status, issues };
}
