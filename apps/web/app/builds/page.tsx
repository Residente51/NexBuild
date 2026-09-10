import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoadBuildButton from "@/components/builder/LoadBuildButton";
import { SavedBuildActions } from "@/components/builds/SavedBuildActions";
import { getBuildProgress } from "@/lib/build/progress";
import {
  listOwnedBuilds,
  type OwnedBuild,
} from "@/lib/build/savedBuilds";
import { CATEGORY_LABELS, type ComponentCategory } from "@/lib/categories";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BuildSelection, PCComponent } from "@/types/component";

export const metadata: Metadata = {
  title: "Mis armados",
  description: "Revisa y administra tus configuraciones guardadas en NexBuild.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UNNAMED_BUILD = "Configuración sin nombre";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Santiago",
});

const PRICE_FORMATTER = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const SUMMARY_CATEGORIES: Exclude<ComponentCategory, "storage">[] = [
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "psu",
  "case",
  "cooler",
];

type ComponentSummary = {
  key: string;
  label: string;
  component: PCComponent;
};

export function getSelectedComponentSummary(
  build: BuildSelection,
): ComponentSummary[] {
  const singleComponents = SUMMARY_CATEGORIES.flatMap((category) => {
    const component = build[category];
    return component
      ? [{ key: category, label: CATEGORY_LABELS[category], component }]
      : [];
  });
  const storageComponents = build.storage.map((component, index) => ({
    key: `storage-${component.id}-${index}`,
    label:
      build.storage.length > 1
        ? `${CATEGORY_LABELS.storage} ${index + 1}`
        : CATEGORY_LABELS.storage,
    component,
  }));

  return [...singleComponents, ...storageComponents];
}

function BuildCard({ savedBuild }: { savedBuild: OwnedBuild }) {
  const name = savedBuild.name ?? UNNAMED_BUILD;
  const progress = getBuildProgress(savedBuild.build);
  const components = getSelectedComponentSummary(savedBuild.build);
  const visibleComponents = components.slice(0, 4);
  const remainingComponents = components.length - visibleComponents.length;
  const titleId = `build-title-${savedBuild.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-xl shadow-black/10"
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="truncate text-xl font-bold tracking-tight text-white"
            >
              {name}
            </h2>
            <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/60">
              <div className="flex gap-1">
                <dt>Creado:</dt>
                <dd>{DATE_FORMATTER.format(new Date(savedBuild.createdAt))}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Actualizado:</dt>
                <dd>{DATE_FORMATTER.format(new Date(savedBuild.updatedAt))}</dd>
              </div>
            </dl>
          </div>
          <p className="shrink-0 text-xl font-black tabular-nums text-[#38BDF8]">
            {PRICE_FORMATTER.format(savedBuild.totalPrice)}
          </p>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {visibleComponents.length > 0 ? (
            visibleComponents.map(({ key, label, component }) => (
              <div
                key={key}
                className="min-w-0 rounded-xl border border-white/5 bg-black/15 px-3 py-2.5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                  {label}
                </p>
                <p className="mt-1 truncate text-sm text-white/80">
                  {component.name}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/50">Sin componentes seleccionados.</p>
          )}
        </div>
        {remainingComponents > 0 && (
          <p className="mt-2 text-sm text-white/60">
            +{remainingComponents} componente{remainingComponents === 1 ? "" : "s"}
          </p>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="font-medium text-white/70">
              {progress.isComplete
                ? "Configuración completa"
                : `${progress.completed} de ${progress.total} partes requeridas`}
            </p>
            <p className="font-bold tabular-nums text-[#38BDF8]">
              {progress.percentage}%
            </p>
          </div>
          <div
            role="progressbar"
            aria-label={`Progreso de ${name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percentage}
            className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-[#0E79B2]"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 bg-black/10 p-4 sm:flex-row sm:items-start">
        <LoadBuildButton
          build={savedBuild.build}
          label="Abrir"
          ariaLabel={`Abrir ${name} en el configurador`}
          fullWidth={false}
        />
        <SavedBuildActions buildId={savedBuild.id} buildName={name} />
      </div>
    </article>
  );
}

export default async function BuildsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=%2Fbuilds");
  }

  const result = await listOwnedBuilds(supabase);

  return (
    <div className="mx-auto w-full max-w-6xl py-4 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#38BDF8]">
            Tu cuenta NexBuild
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Mis armados
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
            Retoma, organiza o duplica tus configuraciones guardadas.
          </p>
        </div>
        <Link
          href="/builder"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E79B2] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1593d3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
        >
          Crear un armado
        </Link>
      </header>

      {!result.success ? (
        <section className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-6 py-8 text-center">
          <h2 className="text-lg font-bold text-red-100">
            No pudimos cargar tus armados
          </h2>
          <p role="alert" className="mt-2 text-sm text-red-100/80">
            {result.error}
          </p>
          <Link
            href="/builds"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-red-200/20 px-4 text-sm font-bold text-red-50 hover:bg-red-100/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
          >
            Reintentar
          </Link>
        </section>
      ) : result.data.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-14 text-center sm:px-10">
          <div
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E79B2]/15 text-[#38BDF8]"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">
            Aún no tienes armados guardados
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/55">
            Elige tus componentes en el configurador y guarda tu primer equipo.
          </p>
          <Link
            href="/builder"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E79B2] px-5 py-3 text-sm font-bold text-white hover:bg-[#1593d3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
          >
            Ir al configurador
          </Link>
        </section>
      ) : (
        <section aria-label="Armados guardados" className="mt-8 grid gap-5 lg:grid-cols-2">
          {result.data.map((savedBuild) => (
            <BuildCard key={savedBuild.id} savedBuild={savedBuild} />
          ))}
        </section>
      )}
    </div>
  );
}
