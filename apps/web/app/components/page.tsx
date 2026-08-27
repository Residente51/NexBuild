"use client";

import { useState, useEffect, useMemo } from "react";
import { useBuildStore } from "@/store/useBuildStore";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";
import { CATEGORY_LABELS, ComponentCategory } from "@/lib/categories";
import type { PCComponent, StorageComponent } from "@/types/component";

type FilterCategory = "all" | ComponentCategory;

function formatSpecs(component: PCComponent): string[] {
  if (!component.specs) return [];
  const s = component.specs as any;
  
  switch (component.category) {
    case "cpu":
      return [
        s.cores ? `${s.cores} Núcleos` : "",
        `Socket ${s.socket}`,
        `${s.tdp}W`,
      ].filter(Boolean);
    case "motherboard":
      return [
        `Socket ${s.socket}`,
        String(s.formFactor).toUpperCase(),
        s.chipset,
      ].filter(Boolean);
    case "gpu":
      return [
        s.vram ? `${s.vram}GB ${s.memoryType || ""}` : "",
        `Largo: ${s.length}mm`,
        `PSU Rec: ${s.recommendedPsuWattage}W`,
      ].filter(Boolean);
    case "ram":
      return [
        String(s.ramType).toUpperCase(),
        `${s.modules}x${s.capacityPerModule}GB`,
        s.speed ? `${s.speed} MHz` : "",
      ].filter(Boolean);
    case "storage":
      return [
        String(s.type).toUpperCase(),
        s.capacity ? `${s.capacity >= 1000 ? s.capacity / 1000 + "TB" : s.capacity + "GB"}` : "",
        s.readSpeed ? `${s.readSpeed} MB/s` : "",
      ].filter(Boolean);
    case "psu":
      return [
        `${s.wattage}W`,
        String(s.formFactor).toUpperCase(),
        s.certification,
      ].filter(Boolean);
    case "case":
      return [`Max GPU: ${s.maxGpuLength}mm`];
    case "cooler":
      return [`${s.type === "air" ? "Aire" : "Líquida"}`];
    default:
      return [];
  }
}

export default function ComponentsPage() {
  const [catalog, setCatalog] = useState<PCComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const setComponent = useBuildStore((state) => state.setComponent);
  const addStorage = useBuildStore((state) => state.addStorage);

  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      const data = await fetchCatalogFromSupabase();
      setCatalog(data);
      setIsLoading(false);
    }
    loadCatalog();
  }, []);

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

  const handleAdd = (item: PCComponent) => {
    if (item.category === "storage") {
      addStorage(item as StorageComponent);
    } else {
      setComponent(item.category as any, item);
    }

    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#191923] px-4 py-8 md:py-12">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#FBFEF9] md:text-4xl">
              Catálogo de Componentes
            </h1>
            <p className="mt-2 text-white/60">
              Explora y selecciona las piezas perfectas para armar tu equipo ideal.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
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
                type="text"
                placeholder="Buscar componente o marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[#FBFEF9] placeholder:text-white/40 transition-colors focus:border-[#0E79B2] focus:outline-none focus:ring-1 focus:ring-[#0E79B2]"
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
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
        {isLoading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0E79B2] border-t-transparent"></div>
            <p className="mt-4 text-sm font-medium text-white/60">
              Cargando componentes desde la nube...
            </p>
          </div>
        ) : filteredCatalog.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCatalog.map((item) => {
              const image = (item as any).image_url || item.image;
              const specs = formatSpecs(item);
              
              return (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#0E79B2]/50 hover:shadow-lg hover:shadow-black/20"
                >
                  <div>
                    {/* Image Container */}
                    <div className="mb-4 h-36 w-full rounded-xl bg-white/5 flex flex-col items-center justify-center overflow-hidden border border-white/5">
                      {image && !imgErrors[item.id] ? (
                        <img 
                          src={image} 
                          alt={item.name} 
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
                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-lg font-bold text-[#FBFEF9]">
                      ${item.price?.toLocaleString("es-CL") || "0"}
                    </span>
                    
                    <button
                      onClick={() => handleAdd(item)}
                      disabled={addedItems[item.id]}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                        addedItems[item.id]
                          ? "bg-[#34D399]/20 text-[#34D399]"
                          : "bg-[#0E79B2] text-white hover:bg-[#0A5C87]"
                      }`}
                    >
                      {addedItems[item.id] ? (
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
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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