"use client";

/**
 * A single row in the PC Builder slot list.
 *
 * Renders either:
 * - A selected component with its name, price, and a remove button.
 * - An empty slot with a "+ Elegir [Categoría]" call-to-action.
 */

import type { ComponentCategory } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { PCComponent } from "@/types/component";

// ---------------------------------------------------------------------------
// Category icons (inline SVG paths for zero dependencies)
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<ComponentCategory, string> = {
  cpu: "M9 3V1m0 2v2m6-2V1m0 2v2M9 21v2m6-2v2M3 9h2M1 9h2m16 0h2m2 0h-2M3 15h2m-4 0h2m16 0h2m2 0h-2M6 6h12a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1zm3 3h6v6H9V9z",
  gpu: "M4 7h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2zm4 3a2 2 0 100 4 2 2 0 000-4zm8 0h2v4h-2V10z",
  ram: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm2 3v2h2V8H6zm4 0v2h2V8h-2zm4 0v2h2V8h-2zm4 0v2h2V8h-2z",
  storage: "M4 4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2H4zm14 10a1 1 0 100 2 1 1 0 000-2zm-3 0a1 1 0 100 2 1 1 0 000-2z",
  motherboard: "M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm3 3v4h4V6H7zm0 8v4h4v-4H7zm7-8v4h4V6h-4z",
  case: "M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm6 4a3 3 0 100 6 3 3 0 000-6zm0 10a1 1 0 100 2 1 1 0 000-2z",
  cooler: "M12 2v4m0 12v4M2 12h4m12 0h4m-3.17-6.83l-2.83 2.83m-4 4l-2.83 2.83M18.83 18.83l-2.83-2.83m-4-4L9.17 9.17M12 8a4 4 0 100 8 4 4 0 000-8z",
  psu: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

interface SlotRowProps {
  category: ComponentCategory;
  component: PCComponent | undefined;
  onSelect: () => void;
  onRemove: () => void;
}

export function SlotRow({
  category,
  component,
  onSelect,
  onRemove,
}: SlotRowProps) {
  const label = CATEGORY_LABELS[category];
  const iconPath = CATEGORY_ICONS[category];

  return (
    <div
      id={`slot-${category}`}
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
          <path d={iconPath} />
        </svg>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        {component ? (
          <>
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-white/60 uppercase">
                {label}
              </p>
              <p className="truncate text-sm font-semibold text-[#FBFEF9]">
                {component.name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-semibold text-[#0E79B2]">
                ${component.price.toLocaleString("es-CL")}
              </span>
              <button
                onClick={onRemove}
                aria-label={`Quitar ${label}`}
                className="rounded-lg p-1.5 text-builder-muted transition-colors
                           hover:bg-builder-danger/10 hover:text-builder-danger"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onSelect}
            className="flex w-full items-center justify-between rounded-lg px-1
                       py-1 text-sm text-builder-muted transition-colors
                       hover:text-builder-accent"
          >
            <span className="font-medium">+ Elegir {label}</span>
            <svg
              className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
