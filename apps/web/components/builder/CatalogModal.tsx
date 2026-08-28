"use client";

/**
 * Catalog modal for selecting a component in the PC Builder.
 *
 * Shows a filtered view of `mockCatalog` based on the active category,
 * and dispatches the selection to the Zustand store.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useBuildStore } from "@/store/useBuildStore";
import { CATEGORY_LABELS } from "@/lib/categories";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";
import type { BuildSelection, PCComponent, StorageComponent } from "@/types/component";

// ---------------------------------------------------------------------------
// Spec badges — show the most relevant specs per category
// ---------------------------------------------------------------------------

function getSpecBadges(item: PCComponent): string[] {
  const badges: string[] = [];
  if (!("specs" in item) || !item.specs) return badges;

  switch (item.category) {
    case "cpu": {
      const s = item.specs;
      badges.push(s.socket);
      badges.push(`${s.tdp}W TDP`);
      if (s.hasIntegratedGraphics) badges.push("iGPU");
      break;
    }
    case "motherboard": {
      const s = item.specs;
      badges.push(s.socket);
      badges.push(s.formFactor);
      badges.push(s.ramType.toUpperCase());
      badges.push(`${s.ramSlots} slots RAM`);
      break;
    }
    case "ram": {
      const s = item.specs;
      badges.push(s.ramType.toUpperCase());
      badges.push(`${s.modules}x${s.capacityPerModule}GB`);
      break;
    }
    case "gpu": {
      const s = item.specs;
      badges.push(`${s.length}mm`);
      badges.push(`${s.slotWidth} slots`);
      badges.push(`PSU rec: ${s.recommendedPsuWattage}W`);
      break;
    }
    case "storage": {
      const s = item.specs;
      badges.push(s.type.toUpperCase());
      badges.push(s.formFactor);
      badges.push(`${s.capacity}GB`);
      break;
    }
    case "psu": {
      const s = item.specs;
      badges.push(`${s.wattage}W`);
      badges.push(s.formFactor.toUpperCase());
      break;
    }
    case "case": {
      const s = item.specs;
      badges.push(s.supportedMotherboards.join(", "));
      badges.push(`GPU max: ${s.maxGpuLength}mm`);
      break;
    }
    case "cooler": {
      const s = item.specs;
      badges.push(s.type.toUpperCase());
      if (s.type === "air" && s.height) badges.push(`${s.height}mm`);
      if (s.type === "aio" && s.radiatorSize) badges.push(`${s.radiatorSize}mm rad`);
      break;
    }
  }

  return badges;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: keyof BuildSelection | null;
}

type CatalogState = "idle" | "loading" | "ready" | "empty" | "error";

export function CatalogModal({ isOpen, onClose, category }: CatalogModalProps) {
  const setComponent = useBuildStore((s) => s.setComponent);
  const addStorage = useBuildStore((s) => s.addStorage);

  const [catalog, setCatalog] = useState<PCComponent[]>([]);
  const [state, setState] = useState<CatalogState>("idle");
  const hasAttemptedRef = useRef(false);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  const fetchCatalog = useCallback(async () => {
    setState("loading");
    const result = await fetchCatalogFromSupabase();

    if (result.success) {
      setCatalog(result.data);
      setState(result.data.length === 0 ? "empty" : "ready");
    } else {
      console.error("Error fetching catalog:", result.error);
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Only fetch once per session
    if (!hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      fetchCatalog();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown, fetchCatalog]);

  if (!isOpen || !category) return null;

  // Filter catalog by active category
  const filtered = catalog.filter((item) => item.category === category);
  const categoryLabel =
    CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;

  function handleSelect(item: PCComponent) {
    if (category === "storage") {
      addStorage(item as StorageComponent);
    } else {
      setComponent(
        category as Exclude<keyof BuildSelection, "storage">,
        item,
      );
    }
    onClose();
  }

  return (
    <div
      id="catalog-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Panel */}
      <div
        id="catalog-modal-panel"
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col
                   overflow-hidden rounded-2xl border border-white/10
                   bg-[#191923] shadow-xl shadow-black/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-builder-text">
              Elegir {categoryLabel}
            </h2>
            <p className="mt-0.5 text-xs text-builder-muted">
              {filtered.length} {filtered.length === 1 ? "opción disponible" : "opciones disponibles"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-2 text-builder-muted transition-colors
                       hover:bg-builder-surface hover:text-builder-text"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto p-6">
          {state === "loading" && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm font-medium text-builder-text">
                Cargando componentes desde la nube...
              </p>
            </div>
          )}
          {state === "empty" && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-builder-muted">
                No hay componentes disponibles.
              </p>
            </div>
          )}
          {state === "error" && (
            <div className="flex h-40 flex-col items-center justify-center gap-3">
              <p className="text-sm text-builder-muted">
                Error al cargar componentes.
              </p>
              <button
                onClick={() => fetchCatalog()}
                className="rounded-md bg-[#0E79B2] px-3 py-1.5 text-xs font-medium text-[#FBFEF9] transition-colors hover:bg-[#0A5C87]"
              >
                Reintentar
              </button>
            </div>
          )}
          {state === "ready" && filtered.length === 0 && (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-builder-muted">
                No hay componentes disponibles para esta categoría.
              </p>
            </div>
          )}
          {state === "ready" && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((item) => {
                const badges = getSpecBadges(item);
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-4 rounded-xl
                               border border-white/10 bg-white/5 p-6
                               transition-colors duration-200 hover:border-[#0E79B2]/40"
                  >
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white/60">
                        {item.brand}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#FBFEF9]">
                        {item.name}
                      </p>

                      {/* Spec badges */}
                      {badges.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {badges.map((badge) => (
                            <span
                              key={badge}
                              className="inline-block rounded-md bg-white/5 px-2.5
                                         py-1 text-[11px] font-medium text-white/60"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price + action */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-sm font-bold text-[#0E79B2]">
                        ${item.price.toLocaleString("es-CL")}
                      </span>
                      <button
                        onClick={() => handleSelect(item)}
                        className="rounded-lg bg-[#0E79B2] px-4 py-1.5 text-xs
                                   font-semibold text-[#FBFEF9] transition-colors
                                   hover:bg-[#0A5C87]"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
