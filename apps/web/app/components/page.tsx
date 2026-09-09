"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CompareButton } from "@/components/compare/CompareButton";
import { buttonClassName } from "@/components/ui/Button";
import { useBuildStore } from "@/store/useBuildStore";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";
import { CATEGORY_LABELS, ComponentCategory } from "@/lib/categories";
import type { PCComponent, StorageComponent, BuildSelection } from "@/types/component";

type FilterCategory = "all" | ComponentCategory;

function formatSpecs(component: PCComponent): string[] {
  if (!component.specs) return [];

  switch (component.category) {
    case "cpu": {
      const { specs } = component;
      return [
        specs?.cores ? `${specs.cores} Núcleos` : "",
        specs?.socket ? `Socket ${specs.socket}` : "",
        specs?.tdp ? `${specs.tdp}W` : "",
      ].filter(Boolean);
    }
    case "motherboard": {
      const { specs } = component;
      return [
        specs?.socket ? `Socket ${specs.socket}` : "",
        specs?.formFactor ? String(specs.formFactor).toUpperCase() : "",
        specs?.chipset ?? "",
      ].filter(Boolean);
    }
    case "gpu": {
      const { specs } = component;
      return [
        specs?.vram ? `${specs.vram}GB ${specs.memoryType || ""}` : "",
        specs?.length ? `Largo: ${specs.length}mm` : "",
        specs?.recommendedPsuWattage ? `PSU Rec: ${specs.recommendedPsuWattage}W` : "",
      ].filter(Boolean);
    }
    case "ram": {
      const { specs } = component;
      return [
        specs?.ramType ? String(specs.ramType).toUpperCase() : "",
        specs?.modules && specs?.capacityPerModule ? `${specs.modules}x${specs.capacityPerModule}GB` : "",
        specs?.speed ? `${specs.speed} MHz` : "",
      ].filter(Boolean);
    }
    case "storage": {
      const { specs } = component;
      return [
        specs?.type ? String(specs.type).toUpperCase() : "",
        specs?.capacity ? `${specs.capacity >= 1000 ? (specs.capacity / 1000).toFixed(1) + "TB" : specs.capacity + "GB"}` : "",
        specs?.readSpeed ? `${specs.readSpeed} MB/s` : "",
      ].filter(Boolean);
    }
    case "psu": {
      const { specs } = component;
      return [
        specs?.wattage ? `${specs.wattage}W` : "",
        specs?.formFactor ? String(specs.formFactor).toUpperCase() : "",
        specs?.certification ?? "",
      ].filter(Boolean);
    }
    case "case": {
      const { specs } = component;
      return specs?.maxGpuLength ? [`Max GPU: ${specs.maxGpuLength}mm`] : [];
    }
    case "cooler": {
      const { specs } = component;
      return specs?.type ? [`${specs.type === "air" ? "Aire" : "Líquida"}`] : [];
    }
    default:
      return [];
  }
}

type CatalogPageState = "loading" | "ready" | "empty" | "error";

export default function ComponentsPage() {
  const [catalog, setCatalog] = useState<PCComponent[]>([]);
  const [state, setState] = useState<CatalogPageState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const hasInitialized = useRef(false);

  const setComponent = useBuildStore((state) => state.setComponent);
  const addStorage = useBuildStore((state) => state.addStorage);
  const reconcileCatalog = useBuildStore((state) => state.reconcileCatalog);

  const handleLoadCatalog = useCallback(async (force = false) => {
    setState("loading");
    setError(null);
    const result = await fetchCatalogFromSupabase({ force });
    if (result.success) {
      setCatalog(result.data);
      reconcileCatalog(result.data);
      setState(result.data.length === 0 ? "empty" : "ready");
    } else {
      console.error("Error loading catalog:", result.error);
      setError(result.error);
      setState("error");
    }
  }, [reconcileCatalog]);

  useEffect(() => {
    const load = async () => {
      setState("loading");
      setError(null);
      await Promise.resolve(useBuildStore.persist.rehydrate()).catch(
        () => undefined,
      );
      const result = await fetchCatalogFromSupabase();
      if (result.success) {
        setCatalog(result.data);
        reconcileCatalog(result.data);
        setState(result.data.length === 0 ? "empty" : "ready");
      } else {
        console.error("Error loading catalog:", result.error);
        setError(result.error);
        setState("error");
      }
    };

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      load();
    }
  }, [reconcileCatalog]);

  const categories: { id: FilterCategory; label: string }[] = [
    { id: "all", label: "Todos" },
    ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
      id: id as FilterCategory,
      label,
    })),
  ];

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchQuery, activeCategory]);

  const itemsWithSpecs = useMemo(() => {
    return filteredCatalog.map((item) => ({
      item,
      specs: formatSpecs(item),
    }));
  }, [filteredCatalog]);

  const handleAdd = useCallback((item: PCComponent) => {
    if (item.inStock === false) return;

    if (item.category === "storage") {
      addStorage(item as StorageComponent);
    } else {
      setComponent(item.category as Exclude<keyof BuildSelection, "storage">, item);
    }

    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  }, [setComponent, addStorage]);

  return (
    <div className="min-h-screen bg-[#191923] px-4 py-8 md:py-12">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#FBFEF9] md:text-4xl">
              Catálogo de Componentes
            </h1>
            <p className="mt-2 text-white/60">
              Explora el catálogo y añade piezas a tu configuración.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <label htmlFor="catalog-search" className="sr-only">
                Buscar por componente o marca
              </label>
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                id="catalog-search"
                type="text"
                placeholder="Buscar componente o marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[#FBFEF9] placeholder:text-white/40 transition-colors focus:border-[#0E79B2] focus:outline-none focus:ring-1 focus:ring-[#0E79B2]"
              />
            </div>

            {/* Category Filters */}
            <div
              className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar"
              role="group"
              aria-label="Filtrar por categoría"
            >
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={activeCategory === cat.id}
                  className={`min-h-11 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                    activeCategory === cat.id
                      ? "bg-[#0E79B2] text-[#FBFEF9]"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Area */}
        {state === "loading" && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0E79B2] border-t-transparent"></div>
            <p className="mt-4 text-sm font-medium text-white/60">
              Cargando componentes desde la nube...
            </p>
          </div>
        )}
        {state === "error" && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5">
            <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-white/60">
                Error al cargar componentes
              </p>
              {error && (
                <p className="mt-2 text-xs text-white/40">
                  {error}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleLoadCatalog(true)}
              className="min-h-11 rounded-xl bg-[#0E79B2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A5C87]"
            >
              Reintentar
            </button>
          </div>
        )}
        {state === "empty" && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <svg className="h-12 w-12 text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.325 15.581l-5.85-5.85m0 0l-7.07-7.07m7.07 7.07l7.07 7.07m-7.07-7.07l-7.07 7.07" />
            </svg>
            <p className="text-lg font-medium text-[#FBFEF9]">No se encontraron componentes</p>
            <p className="mt-1 text-sm text-white/50">
              El catálogo está vacío.
            </p>
          </div>
        )}
        {state === "ready" && filteredCatalog.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {itemsWithSpecs.map(({ item, specs }) => {
              const image = item.image;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#0E79B2]/50 hover:shadow-lg hover:shadow-black/20"
                >
                  <div>
                    {/* Image Container */}
                    <div className="mb-4 h-36 w-full rounded-xl bg-white/5 flex flex-col items-center justify-center overflow-hidden border border-white/5">
                      {image && !imgErrors[item.id] ? (
                        <Image
                          src={image}
                          alt={item.name}
                          width={144}
                          height={144}
                          unoptimized
                          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                        />
                      ) : (
                        <>
                          <div className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                            {CATEGORY_LABELS[item.category]}
                          </div>
                          <div className="text-xs font-medium text-zinc-500 mt-1">
                            {item.brand}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-xs font-semibold text-white/40">
                        {item.brand}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-[#FBFEF9] leading-tight">
                      {item.name}
                    </h3>
                    
                    {/* Description */}
                    {item.description && (
                      <p className="mt-2 text-xs text-zinc-400 line-clamp-1" title={item.description}>
                        {item.description}
                      </p>
                    )}
                    
                    {/* Badges */}
                    {specs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {specs.map((spec, i) => (
                          <span key={i} className="bg-white/5 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-400">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom section */}
                  <div className="mt-6 border-t border-white/5 pt-4">
                    <span className="text-lg font-bold tabular-nums text-[#FBFEF9]">
                      {item.inStock === false
                        ? "Sin stock"
                        : item.price > 0
                        ? `$${item.price.toLocaleString("es-CL")}`
                        : "Sin precio"}
                    </span>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href={`/components/${item.slug}`}
                        className={buttonClassName(
                          "secondary",
                          "w-full px-3 py-2 text-sm",
                        )}
                      >
                        Ver detalles
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleAdd(item)}
                        disabled={addedItems[item.id] || item.inStock === false}
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                          item.inStock === false
                            ? "bg-white/5 text-white/35"
                            : addedItems[item.id]
                            ? "bg-[#34D399]/20 text-[#34D399]"
                            : "bg-[#0E79B2] text-white hover:bg-[#0A5C87]"
                        }`}
                      >
                        {item.inStock === false ? (
                          "No disponible"
                        ) : addedItems[item.id] ? (
                          <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Añadido
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Añadir
                          </>
                        )}
                      </button>

                      <CompareButton
                        component={item}
                        className="col-span-2"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {state === "ready" && filteredCatalog.length === 0 && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <svg className="h-12 w-12 text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-lg font-medium text-[#FBFEF9]">No se encontraron resultados</p>
            <p className="mt-1 text-sm text-white/50">
              Intenta ajustando los filtros o tu búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
