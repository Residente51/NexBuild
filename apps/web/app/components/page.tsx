"use client";

import { useState, useMemo } from "react";
import { mockCatalog } from "@/data/catalog";
import { useBuildStore } from "@/store/useBuildStore";
import { CATEGORY_LABELS, ComponentCategory } from "@/lib/categories";
import type { PCComponent, StorageComponent } from "@/types/component";

type FilterCategory = "all" | ComponentCategory;

function formatSpecs(component: PCComponent): string {
  if (!component.specs) return "Sin especificaciones";
  const s = component.specs as any;
  
  switch (component.category) {
    case "cpu":
      return `Socket: ${s.socket} | TDP: ${s.tdp}W`;
    case "motherboard":
      return `Socket: ${s.socket} | Factor: ${s.formFactor}`;
    case "gpu":
      return `Largo: ${s.length}mm | Fuente: ${s.recommendedPsuWattage}W`;
    case "ram":
      return `${String(s.ramType).toUpperCase()} | ${s.modules}x${s.capacityPerModule}GB`;
    case "storage":
      return `${String(s.type).toUpperCase()} | ${s.capacity}GB`;
    case "psu":
      return `${s.wattage}W | ${String(s.formFactor).toUpperCase()}`;
    case "case":
      return `Max GPU: ${s.maxGpuLength}mm`;
    case "cooler":
      return `${s.type === "air" ? "Aire" : "Líquida"}`;
    default:
      return "Detalles técnicos";
  }
}

export default function ComponentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const setComponent = useBuildStore((state) => state.setComponent);
  const addStorage = useBuildStore((state) => state.addStorage);

  const categories: { id: FilterCategory; label: string }[] = [
    { id: "all", label: "Todos" },
    ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
      id: id as FilterCategory,
      label,
    })),
  ];

  const filteredCatalog = useMemo(() => {
    return mockCatalog.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleAdd = (item: PCComponent) => {
    if (item.category === "storage") {
      addStorage(item as StorageComponent);
    } else {
      setComponent(item.category, item);
    }

    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8 md:py-12">
      <div className="container mx-auto max-w-6xl">
        <header className="mb-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#FBFEF9] md:text-4xl">
              Catálogo de Componentes
            </h1>
            <p className="mt-2 text-white/60">
              Explora y selecciona las piezas para tu próxima build.
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
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[#FBFEF9] placeholder:text-white/40 focus:border-[#0E79B2] focus:outline-none focus:ring-1 focus:ring-[#0E79B2] transition-colors"
              />
            </div>

            {/* Category Filters (Scrollable horizontally on mobile) */}
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

        {/* Component Grid */}
        {filteredCatalog.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5 transition-all hover:border-[#0E79B2]/50 hover:bg-zinc-800/50"
              >
                <div>
                  <div className="mb-3 flex items-start justify-between">
                    <span className="inline-block rounded bg-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/60">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <span className="text-xs font-semibold text-[#0E79B2]">
                      {item.brand}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#FBFEF9] line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-xs text-white/50">
                    {formatSpecs(item)}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-[#FBFEF9]">
                    ${item.price.toLocaleString("es-CL")}
                  </span>
                  
                  <button
                    onClick={() => handleAdd(item)}
                    disabled={addedItems[item.id]}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      addedItems[item.id]
                        ? "bg-builder-success/20 text-builder-success"
                        : "bg-[#0E79B2]/10 text-[#0E79B2] hover:bg-[#0E79B2]/20"
                    }`}
                  >
                    {addedItems[item.id] ? (
                      <>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Añadido
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Añadir
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-zinc-800/50 bg-zinc-900/30">
            <div className="text-center">
              <p className="text-lg font-medium text-[#FBFEF9]">No se encontraron componentes</p>
              <p className="mt-1 text-sm text-white/50">
                Intenta con otra búsqueda o categoría.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}