"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/categories";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";
import {
  getStockLabel,
  getTechnicalSpecifications,
} from "@/lib/components/specifications";
import {
  MAX_COMPARISON_ITEMS,
  hydrateComparisonStore,
  useComparisonStore,
} from "@/store/useComparisonStore";
import type { PCComponent } from "@/types/component";

type ComparisonPageState = "loading" | "ready" | "error";

export interface ComparisonRow {
  label: string;
  values: string[];
  isPrice?: boolean;
}

export function formatComparisonPrice(component: PCComponent): string {
  return component.price > 0
    ? `$${component.price.toLocaleString("es-CL")}`
    : "Sin precio";
}

export function hasDifference(values: string[]): boolean {
  return new Set(values).size > 1;
}

export function getLowestValidPrice(components: PCComponent[]): number | null {
  const prices = components
    .map((component) => component.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length > 0 ? Math.min(...prices) : null;
}

export function getPriceDifference(
  price: number,
  lowestPrice: number | null,
): number | null {
  if (lowestPrice === null || price <= lowestPrice || price <= 0) return null;
  return price - lowestPrice;
}

export function createComparisonRows(
  components: PCComponent[],
): ComparisonRow[] {
  if (components.length === 0) return [];

  const specificationMaps = components.map(
    (component) =>
      new Map(
        getTechnicalSpecifications(component).map((specification) => [
          specification.label,
          specification.value,
        ]),
      ),
  );
  const specificationLabels = Array.from(
    new Set(specificationMaps.flatMap((map) => Array.from(map.keys()))),
  );

  return [
    {
      label: "Marca",
      values: components.map((component) => component.brand),
    },
    {
      label: "Categoría",
      values: components.map(
        (component) => CATEGORY_LABELS[component.category],
      ),
    },
    {
      label: "Precio",
      values: components.map(formatComparisonPrice),
      isPrice: true,
    },
    {
      label: "Disponibilidad",
      values: components.map(getStockLabel),
    },
    ...specificationLabels.map((label) => ({
      label,
      values: specificationMaps.map((map) => map.get(label) ?? "—"),
    })),
  ];
}

export function getVisibleComparisonRows(
  rows: ComparisonRow[],
  hideEqualRows: boolean,
): ComparisonRow[] {
  return hideEqualRows ? rows.filter((row) => hasDifference(row.values)) : rows;
}

function ComparisonImage({ component }: { component: PCComponent }) {
  const [hasError, setHasError] = useState(false);
  const categoryLabel = CATEGORY_LABELS[component.category];

  return (
    <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/5">
      {component.image && !hasError ? (
        <Image
          src={component.image}
          alt={`${component.name} de ${component.brand}`}
          fill
          sizes="240px"
          unoptimized
          className="object-contain p-3"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
            {categoryLabel}
          </p>
          <p className="mt-1 text-sm text-white/50">{component.brand}</p>
        </div>
      )}
    </div>
  );
}

function SelectedComponentPreview({
  component,
  onRemove,
}: {
  component: PCComponent;
  onRemove: () => void;
}) {
  return (
    <article className="mx-auto mt-6 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
      <ComparisonImage component={component} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
        {CATEGORY_LABELS[component.category]}
      </p>
      <h3 className="mt-1 text-lg font-bold text-[#FBFEF9]">
        {component.name}
      </h3>
      <p className="mt-1 text-sm text-white/60">{component.brand}</p>
      <Button
        variant="secondary"
        onClick={onRemove}
        className="mt-4 w-full px-4 py-2 text-sm"
      >
        Quitar de la comparación
      </Button>
    </article>
  );
}

export function ComparisonView() {
  const selectedItems = useComparisonStore((state) => state.items);
  const removeComponent = useComparisonStore((state) => state.removeComponent);
  const clearComparison = useComparisonStore(
    (state) => state.clearComparison,
  );
  const [catalog, setCatalog] = useState<PCComponent[]>([]);
  const [state, setState] = useState<ComparisonPageState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [hideEqualRows, setHideEqualRows] = useState(false);

  const loadCatalog = useCallback(async (force = false) => {
    try {
      await hydrateComparisonStore();
    } catch {
      setError("No pudimos leer la selección guardada.");
      setState("error");
      return;
    }

    setState("loading");
    setError(null);

    const result = await fetchCatalogFromSupabase({ force });
    if (!result.success) {
      setError(result.error);
      setState("error");
      return;
    }

    const catalogBySlug = new Map(
      result.data.map((component) => [component.slug, component]),
    );
    const currentItems = useComparisonStore.getState().items;

    for (const item of currentItems) {
      const component = catalogBySlug.get(item.slug);
      if (!component || component.category !== item.category) {
        useComparisonStore.getState().removeComponent(item.slug);
      }
    }

    setCatalog(result.data);
    setState("ready");
  }, []);

  useEffect(() => {
    let isActive = true;

    void Promise.resolve().then(() => {
      if (isActive) return loadCatalog();
    });

    return () => {
      isActive = false;
    };
  }, [loadCatalog]);

  const components = useMemo(() => {
    const catalogBySlug = new Map(
      catalog.map((component) => [component.slug, component]),
    );

    return selectedItems
      .map((item) => catalogBySlug.get(item.slug))
      .filter((component): component is PCComponent => Boolean(component));
  }, [catalog, selectedItems]);

  const rows = useMemo(() => createComparisonRows(components), [components]);
  const differenceRows = useMemo(
    () => rows.filter((row) => hasDifference(row.values)),
    [rows],
  );
  const visibleRows = useMemo(
    () => getVisibleComparisonRows(rows, hideEqualRows),
    [hideEqualRows, rows],
  );
  const lowestPrice = useMemo(() => getLowestValidPrice(components), [components]);

  const selectedCategory = components[0]?.category;

  return (
    <div className="mx-auto max-w-7xl px-2 py-8 sm:px-4 md:py-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#38BDF8]">
            Comparador
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#FBFEF9] sm:text-4xl">
            Compara componentes
          </h1>
          <p className="mt-3 max-w-2xl text-white/60">
            Selecciona entre 2 y 4 componentes de la misma categoría.
          </p>
        </div>

        {state === "ready" && components.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {components.length < MAX_COMPARISON_ITEMS && (
              <Link
                href="/components"
                className={buttonClassName("primary", "px-5 py-2 text-sm")}
              >
                Añadir otro
              </Link>
            )}
            <Button
              variant="secondary"
              onClick={clearComparison}
              className="px-5 py-2 text-sm"
            >
              Limpiar comparación
            </Button>
          </div>
        )}
      </header>

      {state === "loading" && (
        <div
          role="status"
          className="mt-8 flex min-h-[45vh] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60"
        >
          Cargando comparación...
        </div>
      )}

      {state === "error" && (
        <div
          role="alert"
          className="mt-8 flex min-h-[45vh] flex-col items-center justify-center gap-4 rounded-2xl border border-red-400/20 bg-red-400/5 px-6 text-center"
        >
          <h2 className="text-xl font-bold text-[#FBFEF9]">
            No pudimos cargar la comparación
          </h2>
          {error && <p className="max-w-md text-sm text-red-200">{error}</p>}
          <Button onClick={() => void loadCatalog(true)}>Reintentar</Button>
        </div>
      )}

      {state === "ready" && components.length < 2 && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center sm:px-8">
          <h2 className="text-2xl font-bold text-[#FBFEF9]">
            Faltan componentes para comparar
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            {components.length === 1
              ? "Añade al menos otro componente de la misma categoría."
              : "Añade al menos dos componentes desde el catálogo o su página de detalle."}
          </p>

          {components.length === 1 && (
            <SelectedComponentPreview
              component={components[0]}
              onRemove={() => removeComponent(components[0].slug)}
            />
          )}

          <Link
            href="/components"
            className={buttonClassName("primary", "mt-6")}
          >
            Explorar componentes
          </Link>
        </section>
      )}

      {state === "ready" && components.length >= 2 && selectedCategory && (
        <section className="mt-8" aria-labelledby="comparison-table-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="comparison-table-title"
                className="text-2xl font-bold text-[#FBFEF9]"
              >
                {CATEGORY_LABELS[selectedCategory]}
              </h2>
              <p className="mt-1 text-sm text-white/50">
                {components.length} de {MAX_COMPARISON_ITEMS} componentes
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-white/50" aria-live="polite">
                {differenceRows.length} {differenceRows.length === 1 ? "diferencia visible" : "diferencias visibles"}
              </p>
              <button
                type="button"
                aria-pressed={hideEqualRows}
                aria-controls="comparison-table-body"
                onClick={() => setHideEqualRows((value) => !value)}
                className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/75 transition-colors hover:border-[#0E79B2]/50 hover:bg-[#0E79B2]/10 hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
              >
                {hideEqualRows ? "Mostrar todas" : "Ocultar iguales"}
              </button>
            </div>
          </div>

          {hideEqualRows && visibleRows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
              <h3 className="text-lg font-bold text-[#FBFEF9]">No hay diferencias visibles</h3>
              <p className="mt-2 text-sm text-white/60">
                Estos componentes tienen los mismos valores comparables.
              </p>
              <button
                type="button"
                onClick={() => setHideEqualRows(false)}
                className="mt-5 min-h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/75 transition-colors hover:border-[#0E79B2]/50 hover:bg-[#0E79B2]/10 hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
              >
                Mostrar todas las especificaciones
              </button>
            </div>
          ) : (
            <div
              role="region"
              aria-labelledby="comparison-table-title"
              tabIndex={0}
              className="mt-4 snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-white/10 bg-white/5 scroll-smooth motion-reduce:scroll-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
            >
              <table className="w-full min-w-max border-collapse text-left">
                <caption className="sr-only">
                  Comparación de {components.length} componentes de categoría{" "}
                  {CATEGORY_LABELS[selectedCategory]}
                </caption>
                <thead>
                  <tr className="border-b border-white/10 align-top">
                    <th
                      scope="col"
                      className="sticky left-0 z-20 w-44 min-w-44 bg-[#191923] p-4 text-sm font-semibold text-white/70 shadow-[8px_0_14px_rgba(0,0,0,0.16)]"
                    >
                      Característica
                    </th>
                    {components.map((component) => {
                      const isLowestPrice =
                        lowestPrice !== null && component.price === lowestPrice;

                      return (
                        <th
                          key={component.slug}
                          scope="col"
                          className="w-64 min-w-64 snap-start p-4"
                        >
                          <ComparisonImage component={component} />
                          <Link
                            href={`/components/${component.slug}`}
                            className="mt-4 block rounded-lg text-lg font-bold text-[#FBFEF9] hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
                          >
                            {component.name}
                          </Link>
                          <p className="mt-1 text-sm font-normal text-white/50">
                            {component.brand}
                          </p>
                          <p className={`mt-3 text-lg font-bold tabular-nums ${
                            isLowestPrice ? "text-emerald-300" : "text-[#FBFEF9]"
                          }`}>
                            {formatComparisonPrice(component)}
                          </p>
                          {isLowestPrice && (
                            <p className="mt-1 text-xs font-semibold text-emerald-300">
                              Precio mínimo válido
                            </p>
                          )}
                          <p className={`mt-2 text-xs font-semibold ${
                            component.inStock === false ? "text-red-300" : "text-emerald-300"
                          }`}>
                            {getStockLabel(component)}
                          </p>
                          <Button
                            variant="secondary"
                            onClick={() => removeComponent(component.slug)}
                            className="mt-4 w-full px-4 py-2 text-sm"
                            aria-label={`Quitar ${component.name} de la comparación`}
                          >
                            Quitar
                          </Button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody id="comparison-table-body">
                  {visibleRows.map((row) => {
                    const isDifferent = hasDifference(row.values);

                    return (
                      <tr
                        key={row.label}
                        className={`border-b border-white/5 last:border-b-0 ${
                          isDifferent ? "bg-[#0E79B2]/[0.045]" : ""
                        }`}
                      >
                        <th
                          scope="row"
                          className={`sticky left-0 z-10 w-44 min-w-44 p-4 align-top text-sm font-semibold text-[#FBFEF9] shadow-[8px_0_14px_rgba(0,0,0,0.12)] ${
                            isDifferent ? "bg-[#102536]" : "bg-[#191923]"
                          }`}
                        >
                          {row.label}
                          {isDifferent && (
                            <span className="mt-2 block text-[11px] font-semibold uppercase tracking-wider text-[#38BDF8]">
                              Diferencia
                            </span>
                          )}
                        </th>
                        {row.values.map((value, index) => {
                          const component = components[index];
                          const priceDifference = row.isPrice
                            ? getPriceDifference(component.price, lowestPrice)
                            : null;
                          const isLowestPrice =
                            row.isPrice &&
                            lowestPrice !== null &&
                            component.price === lowestPrice;

                          return (
                            <td
                              key={`${component.slug}-${row.label}`}
                              className={`w-64 min-w-64 snap-start p-4 align-top text-sm text-white/75 ${
                                isDifferent ? "bg-[#0E79B2]/[0.035]" : ""
                              } ${row.isPrice ? "tabular-nums font-semibold text-[#FBFEF9]" : ""}`}
                            >
                              <span className={isLowestPrice ? "text-emerald-300" : undefined}>
                                {value}
                              </span>
                              {priceDifference !== null && (
                                <span className="mt-1 block text-xs font-medium text-white/50">
                                  +${priceDifference.toLocaleString("es-CL")} vs. menor precio
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
