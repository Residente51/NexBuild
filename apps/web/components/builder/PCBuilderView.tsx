"use client";

/**
 * Main PC Builder configurator view.
 *
 * Two-column responsive layout:
 * - Left (slots list): one SlotRow per category + storage array.
 * - Right (sticky summary): price, wattage, compatibility status.
 */

import { useState } from "react";
import { useBuildStore } from "@/store/useBuildStore";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { ComponentCategory } from "@/lib/categories";
import type { BuildSelection, StorageComponent } from "@/types/component";
import { SlotRow } from "./SlotRow";
import { BuildSummaryPanel } from "./BuildSummaryPanel";
import { CatalogModal } from "./CatalogModal";

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
      className="flex items-center gap-4 rounded-xl border border-builder-border
                 bg-builder-surface p-4 transition-colors duration-200
                 hover:border-builder-accent/40"
    >
      {/* Icon */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center
                    rounded-lg bg-builder-border/60"
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
          <p className="text-xs font-medium tracking-wide text-builder-muted uppercase">
            Almacenamiento
          </p>
          <p className="truncate text-sm font-semibold text-builder-text">
            {device.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold text-builder-accent">
            ${device.price.toLocaleString("es-CL")}
          </span>
          <button
            onClick={onRemove}
            aria-label={`Quitar ${device.name}`}
            className="rounded-lg p-1.5 text-builder-muted transition-colors
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof BuildSelection | null>(null);

  function openCatalog(category: keyof BuildSelection) {
    setActiveCategory(category);
    setIsModalOpen(true);
  }

  const report = getCompatibilityReport();
  const totalPrice = getTotalPrice();

  // Check if at least one component is selected
  const hasComponents =
    SINGLE_SLOTS.some((cat) => build[cat] != null) ||
    build.storage.length > 0;

  return (
    <section
      id="pc-builder"
      className="min-h-screen bg-builder-bg px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-builder-text sm:text-3xl">
            Arma tu PC
          </h1>
          <p className="mt-1 text-sm text-builder-muted">
            Selecciona tus componentes y verifica la compatibilidad en tiempo real.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left — Slots */}
          <div className="space-y-3">
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
              {build.storage.map((device) => (
                <StorageRow
                  key={device.id}
                  device={device}
                  onRemove={() => removeStorage(device.id)}
                />
              ))}

              {/* Add storage CTA */}
              <button
                onClick={() => openCatalog("storage")}
                className="group flex w-full items-center gap-4 rounded-xl border
                           border-dashed border-builder-border bg-builder-surface/50
                           p-4 text-sm text-builder-muted transition-colors
                           hover:border-builder-accent/40 hover:text-builder-accent"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center
                              rounded-lg bg-builder-border/40"
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

          {/* Right — Summary */}
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
        onClose={() => setIsModalOpen(false)}
        category={activeCategory}
      />
    </section>
  );
}
