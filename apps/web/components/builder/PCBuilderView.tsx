"use client";

/**
 * Main PC Builder configurator view.
 *
 * Two-column responsive layout:
 * - Left (slots list): one SlotRow per category + storage array.
 * - Right (sticky summary): price, wattage, compatibility status.
 */

import { useCallback, useEffect, useState } from "react";
import { useBuildStore } from "@/store/useBuildStore";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { ComponentCategory } from "@/lib/categories";
import type { BuildSelection, StorageComponent } from "@/types/component";
import { SlotRow } from "./SlotRow";
import { BuildSummaryPanel } from "./BuildSummaryPanel";
import { CatalogModal } from "./CatalogModal";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";

// ---------------------------------------------------------------------------
// Ordered slot list (the order in which rows appear in the UI)
// ---------------------------------------------------------------------------

/** Single-slot categories rendered as SlotRow. */
const SINGLE_SLOTS: Exclude<keyof typeof CATEGORY_LABELS, "storage">[] = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "cooler",
  "psu",
  "case",
];

// ---------------------------------------------------------------------------
// Storage sub-row (for the array-based slot)
// ---------------------------------------------------------------------------

function StorageRow({
  device,
  onRemove,
}: {
  device: StorageComponent;
  onRemove: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-4 rounded-xl border border-white/10
                 bg-white/5 p-4 transition-colors duration-200
                 hover:border-[#0E79B2]/40"
    >
      {/* Icon */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center
                    rounded-lg bg-white/5"
      >
        <svg
          className="h-5 w-5 text-builder-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2H4zm14 10a1 1 0 100 2 1 1 0 000-2zm-3 0a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-white/60 uppercase">
            Almacenamiento
          </p>
          <p className="truncate text-sm font-semibold text-[#FBFEF9]">
            {device.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold text-[#0E79B2]">
            ${device.price.toLocaleString("es-CL")}
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar ${device.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-builder-muted transition-colors
                       hover:bg-builder-danger/10 hover:text-builder-danger"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function PCBuilderView() {
  const build = useBuildStore((s) => s.build);
  const removeComponent = useBuildStore((s) => s.removeComponent);
  const removeStorage = useBuildStore((s) => s.removeStorage);
  const clearBuild = useBuildStore((s) => s.clearBuild);
  const getCompatibilityReport = useBuildStore((s) => s.getCompatibilityReport);
  const getTotalPrice = useBuildStore((s) => s.getTotalPrice);
  const reconcileCatalog = useBuildStore((s) => s.reconcileCatalog);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof BuildSelection | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve(useBuildStore.persist.rehydrate())
      .catch(() => undefined)
      .then(() => fetchCatalogFromSupabase())
      .then((result) => {
        if (active && result.success) reconcileCatalog(result.data);
      });
    return () => {
      active = false;
    };
  }, [reconcileCatalog]);

  const openCatalog = useCallback((category: keyof BuildSelection) => {
    setActiveCategory(category);
    setIsModalOpen(true);
  }, []);
  const closeCatalog = useCallback(() => setIsModalOpen(false), []);

  const report = getCompatibilityReport();
  const totalPrice = getTotalPrice();

  // Check if at least one component is selected
  const hasComponents =
    SINGLE_SLOTS.some((cat) => build[cat] != null) ||
    build.storage.length > 0;

  return (
    <section id="pc-builder" className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 pl-2">
        <h1 className="text-3xl font-black tracking-tight text-[#FBFEF9] sm:text-4xl">
          Arma tu PC
        </h1>
        <p className="mt-3 text-sm text-white/60">
          Selecciona tus componentes y verifica la compatibilidad en tiempo real.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left — Slots (Main Bento Box) */}
        <div className="col-span-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 lg:col-span-8 lg:p-8">
          <div className="space-y-4">
            {/* Single-slot categories */}
            {SINGLE_SLOTS.map((category) => (
              <SlotRow
                key={category}
                category={category as ComponentCategory}
                component={build[category] ?? undefined}
                onSelect={() => openCatalog(category)}
                onRemove={() => removeComponent(category)}
              />
            ))}

            {/* Storage — array-based */}
            <div className="space-y-3">
              {build.storage.map((device, index) => (
                <StorageRow
                  key={`${device.id}-${index}`}
                  device={device}
                  onRemove={() => removeStorage(device.id)}
                />
              ))}

              {/* Add storage CTA */}
              <button
                type="button"
                onClick={() => openCatalog("storage")}
                className="group flex w-full items-center gap-4 rounded-xl border
                           border-dashed border-white/10 bg-white/[0.03]
                           p-4 text-sm text-white/60 transition-colors
                           hover:border-[#0E79B2] hover:text-[#0E79B2]"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center
                              rounded-lg bg-white/5"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M12 5v14m-7-7h14" />
                  </svg>
                </div>
                <span className="font-medium">
                  {build.storage.length === 0
                    ? "+ Elegir Almacenamiento"
                    : "+ Agregar otro disco"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right — Summary (Side Bento Box) */}
        <div className="col-span-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 lg:col-span-4">
          <BuildSummaryPanel
            build={build}
            totalPrice={totalPrice}
            report={report}
            onClearBuild={clearBuild}
            hasComponents={hasComponents}
          />
        </div>
      </div>

      {/* Catalog picker modal */}
      <CatalogModal
        isOpen={isModalOpen}
        onClose={closeCatalog}
        category={activeCategory}
      />
    </section>
  );
}
