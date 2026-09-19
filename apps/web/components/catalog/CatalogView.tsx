"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CatalogItemCard } from "@/components/catalog/CatalogItemCard";
import { Button } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/categories";
import {
  filterAndSortCatalog,
  getCatalogBrands,
  parseCatalogSearchParams,
  serializeCatalogFilters,
  updateCatalogSearchParams,
  type CatalogFilters,
} from "@/lib/components/catalog";
import {
  fetchCatalogFromSupabase,
  type CatalogResult,
} from "@/lib/components/repository";
import { useBuildStore } from "@/store/useBuildStore";
import type {
  BuildSelection,
  PCComponent,
  StorageComponent,
} from "@/types/component";

interface CatalogViewProps {
  initialResult: CatalogResult;
}

type HistoryMode = "push" | "replace";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

function CatalogControlLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/55"
    >
      {children}
    </label>
  );
}

const controlClassName =
  "min-h-11 w-full rounded-xl border border-white/10 bg-[#20202c] px-3 py-2.5 text-sm text-[#FBFEF9] outline-none transition-colors placeholder:text-white/35 focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]";

export function CatalogView({ initialResult }: CatalogViewProps) {
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState<PCComponent[]>(
    initialResult.success ? initialResult.data : [],
  );
  const [error, setError] = useState<string | null>(
    initialResult.success ? null : initialResult.error,
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const addedTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const setComponent = useBuildStore((state) => state.setComponent);
  const addStorage = useBuildStore((state) => state.addStorage);
  const reconcileCatalog = useBuildStore((state) => state.reconcileCatalog);

  const filters = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams],
  );
  const brands = useMemo(() => getCatalogBrands(catalog), [catalog]);
  const results = useMemo(
    () => filterAndSortCatalog(catalog, filters),
    [catalog, filters],
  );

  useEffect(() => {
    void Promise.resolve(useBuildStore.persist.rehydrate())
      .catch(() => undefined)
      .then(() => reconcileCatalog(catalog));
  }, [catalog, reconcileCatalog]);

  useEffect(() => {
    const timers = addedTimers.current;
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  const writeUrl = useCallback((next: URLSearchParams, mode: HistoryMode) => {
    const query = next.toString();
    const url = `/components${query ? `?${query}` : ""}`;
    window.history[mode === "push" ? "pushState" : "replaceState"](
      null,
      "",
      url,
    );
  }, []);

  const updateFilters = useCallback(
    (
      patch: Partial<Record<keyof CatalogFilters, string | number | undefined>>,
      mode: HistoryMode = "push",
    ) => {
      const current = new URLSearchParams(window.location.search);
      writeUrl(updateCatalogSearchParams(current, patch), mode);
    },
    [writeUrl],
  );

  const resetFilters = useCallback(() => {
    writeUrl(serializeCatalogFilters({ q: "", stock: "all", sort: "default" }), "push");
  }, [writeUrl]);

  const handleAdd = useCallback(
    (component: PCComponent) => {
      if (component.inStock === false) return;

      if (component.category === "storage") {
        addStorage(component as StorageComponent);
      } else {
        setComponent(
          component.category as Exclude<keyof BuildSelection, "storage">,
          component,
        );
      }

      const previousTimer = addedTimers.current.get(component.id);
      if (previousTimer) clearTimeout(previousTimer);
      setAddedItems((current) => ({ ...current, [component.id]: true }));
      addedTimers.current.set(
        component.id,
        setTimeout(() => {
          setAddedItems((current) => ({ ...current, [component.id]: false }));
          addedTimers.current.delete(component.id);
        }, 2_000),
      );
    },
    [addStorage, setComponent],
  );

  const retryCatalog = useCallback(async () => {
    setIsRetrying(true);
    const result = await fetchCatalogFromSupabase({ force: true });
    if (result.success) {
      setCatalog(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setIsRetrying(false);
  }, []);

  const activeFilters = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      clear: Partial<Record<keyof CatalogFilters, undefined>>;
    }> = [];

    if (filters.q) {
      chips.push({ key: "q", label: `Búsqueda: ${filters.q}`, clear: { q: undefined } });
    }
    if (filters.category) {
      chips.push({
        key: "category",
        label: CATEGORY_LABELS[filters.category],
        clear: { category: undefined },
      });
    }
    if (filters.brand) {
      chips.push({ key: "brand", label: filters.brand, clear: { brand: undefined } });
    }
    if (filters.minPrice !== undefined) {
      chips.push({
        key: "minPrice",
        label: `Desde ${formatPrice(filters.minPrice)}`,
        clear: { minPrice: undefined },
      });
    }
    if (filters.maxPrice !== undefined) {
      chips.push({
        key: "maxPrice",
        label: `Hasta ${formatPrice(filters.maxPrice)}`,
        clear: { maxPrice: undefined },
      });
    }
    if (filters.stock !== "all") {
      chips.push({
        key: "stock",
        label: filters.stock === "in" ? "Con stock" : "Sin stock",
        clear: { stock: undefined },
      });
    }
    if (filters.sort !== "default") {
      const labels = {
        "price-asc": "Precio: menor a mayor",
        "price-desc": "Precio: mayor a menor",
        "name-asc": "Nombre A–Z",
      } as const;
      chips.push({
        key: "sort",
        label: labels[filters.sort],
        clear: { sort: undefined },
      });
    }

    return chips;
  }, [filters]);

  return (
    <main className="min-h-screen bg-[#191923] px-4 py-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-[#FBFEF9] md:text-4xl">
            Catálogo de Componentes
          </h1>
          <p className="mt-2 max-w-[65ch] text-white/60">
            Busca, filtra y compara componentes reales disponibles en Chile.
          </p>
        </header>

        <section
          aria-labelledby="catalog-filters-title"
          className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="catalog-filters-title" className="text-base font-semibold text-[#FBFEF9]">
              Filtrar catálogo
            </h2>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#38BDF8] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <CatalogControlLabel htmlFor="catalog-search">Buscar</CatalogControlLabel>
              <input
                id="catalog-search"
                type="search"
                maxLength={120}
                autoComplete="off"
                placeholder="Nombre, marca, categoría o especificación"
                value={filters.q}
                onChange={(event) =>
                  updateFilters({ q: event.currentTarget.value }, "replace")
                }
                className={controlClassName}
              />
            </div>

            <div>
              <CatalogControlLabel htmlFor="catalog-category">Categoría</CatalogControlLabel>
              <select
                id="catalog-category"
                value={filters.category ?? ""}
                onChange={(event) =>
                  updateFilters({ category: event.currentTarget.value || undefined })
                }
                className={controlClassName}
              >
                <option value="">Todas las categorías</option>
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                  <option key={category} value={category}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <CatalogControlLabel htmlFor="catalog-brand">Marca</CatalogControlLabel>
              <select
                id="catalog-brand"
                value={filters.brand ?? ""}
                onChange={(event) =>
                  updateFilters({ brand: event.currentTarget.value || undefined })
                }
                className={controlClassName}
              >
                <option value="">Todas las marcas</option>
                {filters.brand && !brands.includes(filters.brand) && (
                  <option value={filters.brand}>{filters.brand}</option>
                )}
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div>
              <CatalogControlLabel htmlFor="catalog-min-price">Precio mínimo</CatalogControlLabel>
              <input
                id="catalog-min-price"
                type="number"
                min={0}
                step={1_000}
                inputMode="numeric"
                placeholder="$0"
                value={filters.minPrice ?? ""}
                onChange={(event) =>
                  updateFilters(
                    {
                      minPrice: event.currentTarget.value
                        ? Number(event.currentTarget.value)
                        : undefined,
                    },
                    "replace",
                  )
                }
                className={controlClassName}
              />
            </div>

            <div>
              <CatalogControlLabel htmlFor="catalog-max-price">Precio máximo</CatalogControlLabel>
              <input
                id="catalog-max-price"
                type="number"
                min={0}
                step={1_000}
                inputMode="numeric"
                placeholder="Sin límite"
                value={filters.maxPrice ?? ""}
                onChange={(event) =>
                  updateFilters(
                    {
                      maxPrice: event.currentTarget.value
                        ? Number(event.currentTarget.value)
                        : undefined,
                    },
                    "replace",
                  )
                }
                className={controlClassName}
              />
            </div>

            <div>
              <CatalogControlLabel htmlFor="catalog-stock">Disponibilidad</CatalogControlLabel>
              <select
                id="catalog-stock"
                value={filters.stock}
                onChange={(event) => updateFilters({ stock: event.currentTarget.value })}
                className={controlClassName}
              >
                <option value="all">Todos</option>
                <option value="in">Con stock</option>
                <option value="out">Sin stock</option>
              </select>
            </div>

            <div>
              <CatalogControlLabel htmlFor="catalog-sort">Ordenar por</CatalogControlLabel>
              <select
                id="catalog-sort"
                value={filters.sort}
                onChange={(event) => updateFilters({ sort: event.currentTarget.value })}
                className={controlClassName}
              >
                <option value="default">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre A–Z</option>
              </select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtros activos">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => updateFilters(filter.clear)}
                  aria-label={`Quitar filtro ${filter.label}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-2 text-xs font-semibold text-sky-200 transition-colors hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
                >
                  {filter.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {error ? (
          <section className="mt-8 flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center">
            <div>
              <h2 className="text-lg font-semibold text-[#FBFEF9]">
                No pudimos cargar el catálogo
              </h2>
              <p className="mt-2 text-sm text-white/60">{error}</p>
            </div>
            <Button onClick={() => void retryCatalog()} disabled={isRetrying} aria-busy={isRetrying}>
              {isRetrying ? "Reintentando..." : "Reintentar"}
            </Button>
          </section>
        ) : catalog.length === 0 ? (
          <section className="mt-8 flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <h2 className="text-lg font-semibold text-[#FBFEF9]">El catálogo está vacío</h2>
            <p className="mt-2 text-sm text-white/55">Intenta nuevamente más tarde.</p>
          </section>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-white/65" role="status" aria-live="polite">
                <span className="font-semibold tabular-nums text-[#FBFEF9]">{results.length}</span>{" "}
                {results.length === 1 ? "resultado" : "resultados"}
              </p>
              <p className="hidden text-xs text-white/40 sm:block">
                {catalog.length} productos en el catálogo
              </p>
            </div>

            {results.length > 0 ? (
              <section
                aria-label="Resultados del catálogo"
                className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {results.map((component) => (
                  <CatalogItemCard
                    key={component.id}
                    component={component}
                    isAdded={Boolean(addedItems[component.id])}
                    onAdd={handleAdd}
                  />
                ))}
              </section>
            ) : (
              <section className="mt-4 flex min-h-[36vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <h2 className="text-lg font-semibold text-[#FBFEF9]">
                  No encontramos componentes
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/55">
                  Prueba con otra búsqueda o elimina uno de los filtros activos.
                </p>
                <Button variant="secondary" onClick={resetFilters} className="mt-5">
                  Limpiar filtros
                </Button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
