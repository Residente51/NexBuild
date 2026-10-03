import { CATEGORY_LABELS, type ComponentCategory } from "@/lib/categories";
import type { BuildProgress } from "@/lib/build/progress";
import {
  GUIDED_PRIORITY_LABELS,
  GUIDED_USE_CASE_LABELS,
  getBuildBudgetBreakdown,
  getCategoryBudget,
  getNextRecommendedCategory,
  type CategoryBudgetStatus,
  type GuidedProfile,
} from "@/lib/build/guidance";
import type {
  BuildCompatibilityReport,
  BuildSelection,
  CompatibilityStatus,
} from "@/types/component";

interface GuidedBuilderSummaryProps {
  profile: GuidedProfile;
  build: BuildSelection;
  report: BuildCompatibilityReport;
  progress: BuildProgress;
  onOpenCategory: (category: ComponentCategory) => void;
  onEdit: () => void;
  onDisable: () => void;
}

const BUDGET_STATUS_LABELS: Record<CategoryBudgetStatus, string> = {
  unselected: "Sin seleccionar",
  within: "Dentro del objetivo",
  over: "Sobre el objetivo",
  under: "Bajo el objetivo",
};

const COMPATIBILITY_LABELS: Record<CompatibilityStatus, string> = {
  compatible: "Compatible",
  warning: "Con advertencias",
  incompatible: "Incompatible",
  incomplete: "Incompleto",
};

function formatClp(value: number): string {
  return `$${Math.abs(value).toLocaleString("es-CL")}`;
}

function formatDifference(value: number): string {
  if (value === 0) return "$0";
  return `${value > 0 ? "+" : "−"}${formatClp(value)}`;
}

export function GuidedBuilderSummary({
  profile,
  build,
  report,
  progress,
  onOpenCategory,
  onEdit,
  onDisable,
}: GuidedBuilderSummaryProps) {
  const breakdown = getBuildBudgetBreakdown(profile, build);
  const remaining = profile.budget - breakdown.totalSpent;
  const nextCategory = getNextRecommendedCategory(profile, build);
  const target = nextCategory ? getCategoryBudget(profile, nextCategory) : 0;
  const largestDeviations = [...breakdown.categories]
    .filter((category) => category.status !== "unselected" && category.status !== "within")
    .sort(
      (left, right) =>
        Math.abs(right.difference) - Math.abs(left.difference) ||
        left.category.localeCompare(right.category),
    )
    .slice(0, 3);

  return (
    <section
      aria-labelledby="guided-summary-title"
      className="mb-6 rounded-3xl border border-[#38BDF8]/30 bg-[#0E79B2]/10 p-5 shadow-xl shadow-black/10 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#38BDF8] uppercase">Guía activa</p>
          <h2 id="guided-summary-title" className="mt-1 text-xl font-black text-[#FBFEF9]">
            {GUIDED_USE_CASE_LABELS[profile.useCase]}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Prioridad: {GUIDED_PRIORITY_LABELS[profile.priority]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/75 transition-colors hover:bg-white/5"
          >
            Editar guía
          </button>
          <button
            type="button"
            onClick={onDisable}
            className="min-h-11 rounded-xl px-4 text-sm font-semibold text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          >
            Desactivar
          </button>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-black/15 p-4">
          <dt className="text-xs text-white/50">Presupuesto total</dt>
          <dd className="mt-1 font-bold tabular-nums text-white">{formatClp(profile.budget)}</dd>
        </div>
        <div className="rounded-2xl bg-black/15 p-4">
          <dt className="text-xs text-white/50">Gastado actualmente</dt>
          <dd className="mt-1 font-bold tabular-nums text-white">{formatClp(breakdown.totalSpent)}</dd>
        </div>
        <div className="rounded-2xl bg-black/15 p-4">
          <dt className="text-xs text-white/50">
            {remaining >= 0 ? "Presupuesto restante" : "Sobre el presupuesto"}
          </dt>
          <dd
            className={`mt-1 font-bold tabular-nums ${
              remaining >= 0 ? "text-builder-success" : "text-builder-warning"
            }`}
          >
            {formatClp(remaining)}
          </dd>
        </div>
        <div className="rounded-2xl bg-black/15 p-4">
          <dt className="text-xs text-white/50">Progreso del armado</dt>
          <dd className="mt-1 font-bold tabular-nums text-white">
            {progress.completed} de {progress.total} ({progress.percentage}%)
          </dd>
        </div>
      </dl>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <p className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65">
          <strong className="text-white">{breakdown.withinTargetCount}</strong> categorías dentro del objetivo
        </p>
        <p className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65">
          <strong className="text-white">{breakdown.overTargetCategories.length}</strong> sobre el objetivo
        </p>
        <p className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/65">
          <strong className="text-white">{breakdown.unselectedCategories.length}</strong> sin seleccionar
        </p>
      </div>

      <details className="mt-5 rounded-2xl border border-white/10 bg-black/15">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 py-3 text-sm font-semibold text-white/80">
          Ver presupuesto por categoría
        </summary>
        <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2">
          {breakdown.categories.map((category) => (
            <div key={category.category} className="rounded-xl bg-white/[0.04] p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-white">{CATEGORY_LABELS[category.category]}</p>
                <span
                  className={`text-xs font-semibold ${
                    category.status === "over"
                      ? "text-builder-warning"
                      : category.status === "within"
                        ? "text-builder-success"
                        : "text-white/55"
                  }`}
                >
                  {BUDGET_STATUS_LABELS[category.status]}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-white/40">Objetivo</dt>
                  <dd className="mt-0.5 tabular-nums text-white/75">{formatClp(category.target)}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Gastado</dt>
                  <dd className="mt-0.5 tabular-nums text-white/75">{formatClp(category.spent)}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Diferencia</dt>
                  <dd className="mt-0.5 tabular-nums text-white/75">
                    {formatDifference(category.difference)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </details>

      {progress.isComplete && (
        <div className="mt-5 rounded-2xl border border-builder-success/25 bg-builder-success/5 p-4">
          <p className="text-xs font-semibold tracking-wide text-builder-success uppercase">
            Resumen de tu armado
          </p>
          <div className="mt-3 grid gap-3 text-sm text-white/65 sm:grid-cols-2 lg:grid-cols-4">
            <p>Presupuesto: <strong className="text-white">{formatClp(profile.budget)}</strong></p>
            <p>Gasto: <strong className="text-white">{formatClp(breakdown.totalSpent)}</strong></p>
            <p>
              Diferencia: <strong className="text-white">{formatDifference(breakdown.difference)}</strong>
            </p>
            <p>
              Compatibilidad: <strong className="text-white">{COMPATIBILITY_LABELS[report.status]}</strong>
            </p>
          </div>
          {largestDeviations.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              Mayores desviaciones: {largestDeviations.map((category) =>
                `${CATEGORY_LABELS[category.category]} (${formatDifference(category.difference)})`
              ).join(", ")}.
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/15 p-4 sm:flex-row sm:items-center sm:justify-between">
        {nextCategory ? (
          <>
            <div>
              <p className="text-xs text-white/50">Siguiente categoría sugerida</p>
              <p className="mt-1 font-bold text-white">{CATEGORY_LABELS[nextCategory]}</p>
              <p className="mt-1 text-sm text-white/55">
                Objetivo aproximado: {formatClp(target)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenCategory(nextCategory)}
              className="min-h-11 shrink-0 rounded-xl bg-[#0E79B2] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0A5C87]"
            >
              Ver {CATEGORY_LABELS[nextCategory]}
            </button>
          </>
        ) : (
          <p className="text-sm font-semibold text-builder-success">
            Ya seleccionaste todas las categorías. Puedes seguir ajustando cualquier componente manualmente.
          </p>
        )}
      </div>
    </section>
  );
}
