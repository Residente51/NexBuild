import { CATEGORY_LABELS, type ComponentCategory } from "@/lib/categories";
import {
  GUIDED_PRIORITY_LABELS,
  GUIDED_USE_CASE_LABELS,
  getCategoryBudget,
  getNextRecommendedCategory,
  type GuidedProfile,
} from "@/lib/build/guidance";
import type { BuildSelection } from "@/types/component";

interface GuidedBuilderSummaryProps {
  profile: GuidedProfile;
  build: BuildSelection;
  totalPrice: number;
  onOpenCategory: (category: ComponentCategory) => void;
  onEdit: () => void;
  onDisable: () => void;
}

function formatClp(value: number): string {
  return `$${Math.abs(value).toLocaleString("es-CL")}`;
}

export function GuidedBuilderSummary({
  profile,
  build,
  totalPrice,
  onOpenCategory,
  onEdit,
  onDisable,
}: GuidedBuilderSummaryProps) {
  const remaining = profile.budget - totalPrice;
  const nextCategory = getNextRecommendedCategory(profile, build);
  const target = nextCategory ? getCategoryBudget(profile, nextCategory) : 0;

  return (
    <section
      aria-labelledby="guided-summary-title"
      className="mb-6 rounded-3xl border border-[#38BDF8]/30 bg-[#0E79B2]/10 p-5 shadow-xl shadow-black/10 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#38BDF8] uppercase">
            Guía activa
          </p>
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

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/15 p-4">
          <dt className="text-xs text-white/50">Presupuesto total</dt>
          <dd className="mt-1 font-bold tabular-nums text-white">{formatClp(profile.budget)}</dd>
        </div>
        <div className="rounded-2xl bg-black/15 p-4">
          <dt className="text-xs text-white/50">Gastado actualmente</dt>
          <dd className="mt-1 font-bold tabular-nums text-white">{formatClp(totalPrice)}</dd>
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
      </dl>

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
