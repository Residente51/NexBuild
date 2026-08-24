"use client";

/**
 * Sticky sidebar panel that shows:
 * - Total estimated price (formatted as CLP).
 * - Compatibility status with issue details.
 * - Copy-to-clipboard build export.
 */

import { useState, useCallback, useEffect } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { ComponentCategory } from "@/lib/categories";
import type {
  BuildCompatibilityReport,
  BuildSelection,
  CompatibilityStatus,
} from "@/types/component";

// ---------------------------------------------------------------------------
// Status visual config
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<CompatibilityStatus, string> = {
  compatible: "Compatible",
  warning: "Con Advertencias",
  incompatible: "Incompatible",
};

const STATUS_CONFIG: Record<
  CompatibilityStatus,
  { label: string; dotClass: string; bgClass: string; borderClass: string }
> = {
  compatible: {
    label: "Compatible",
    dotClass: "bg-builder-success",
    bgClass: "bg-builder-success/10",
    borderClass: "border-builder-success/30",
  },
  warning: {
    label: "Advertencias",
    dotClass: "bg-builder-warning",
    bgClass: "bg-builder-warning/10",
    borderClass: "border-builder-warning/30",
  },
  incompatible: {
    label: "Incompatible",
    dotClass: "bg-builder-danger",
    bgClass: "bg-builder-danger/10",
    borderClass: "border-builder-danger/30",
  },
};

// ---------------------------------------------------------------------------
// Build text generator
// ---------------------------------------------------------------------------

/** Order in which single-slot categories appear in the export. */
const EXPORT_SLOT_ORDER: Exclude<keyof BuildSelection, "storage">[] = [
  "cpu",
  "motherboard",
  "ram",
  "gpu",
  "cooler",
  "psu",
  "case",
];

function generateBuildText(
  build: BuildSelection,
  totalPrice: number,
  status: CompatibilityStatus,
): string {
  const lines: string[] = ["🖥️ NexBuild - Mi Configuración", ""];

  for (const slot of EXPORT_SLOT_ORDER) {
    const component = build[slot];
    const label = CATEGORY_LABELS[slot as ComponentCategory];
    if (component) {
      lines.push(`${label}: ${component.name} - $${component.price.toLocaleString("es-CL")}`);
    }
  }

  for (const device of build.storage) {
    lines.push(`Almacenamiento: ${device.name} - $${device.price.toLocaleString("es-CL")}`);
  }

  lines.push("");
  lines.push(`💰 Total estimado: $${totalPrice.toLocaleString("es-CL")} CLP`);
  lines.push(`⚙️ Estado: ${STATUS_LABELS[status]}`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BuildSummaryPanelProps {
  build: BuildSelection;
  totalPrice: number;
  report: BuildCompatibilityReport;
  onClearBuild: () => void;
  hasComponents: boolean;
}

export function BuildSummaryPanel({
  build,
  totalPrice,
  report,
  onClearBuild,
  hasComponents,
}: BuildSummaryPanelProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const statusCfg = STATUS_CONFIG[report.status];

  const handleCopy = useCallback(async () => {
    const text = generateBuildText(build, totalPrice, report.status);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [build, totalPrice, report.status]);

  // Safe values for initial SSR pass to avoid hydration mismatches
  const displayPrice = isMounted ? totalPrice : 0;
  const displayWattage = isMounted ? report.totalWattageEstimated : 0;
  const displayStatusCfg = isMounted ? statusCfg : STATUS_CONFIG["compatible"];
  const displayIssues = isMounted ? report.issues : [];
  const displayHasComponents = isMounted ? hasComponents : false;

  return (
    <aside
      id="build-summary-panel"
      className="sticky top-6 space-y-6"
    >
      {/* Price card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-medium tracking-wide text-white/60 uppercase">
          Total estimado
        </p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-[#FBFEF9]">
          ${displayPrice.toLocaleString("es-CL")}
        </p>
        <p className="mt-4 text-xs text-white/60">
          Consumo estimado: ~{displayWattage}W
        </p>
      </div>

      {/* Compatibility card */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="mb-4 text-xs font-medium tracking-wide text-white/60 uppercase">
          Compatibilidad
        </p>

        {/* Status badge */}
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5
                      text-xs font-semibold ${displayStatusCfg.bgClass} ${displayStatusCfg.borderClass}`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${displayStatusCfg.dotClass}`} />
          <span className="text-builder-text">{displayStatusCfg.label}</span>
        </div>

        {/* Issues list */}
        {displayIssues.length > 0 && (
          <ul className="mt-4 space-y-2.5">
            {displayIssues.map((issue) => (
              <li
                key={issue.code}
                className="flex items-start gap-2.5 text-xs leading-relaxed"
              >
                <span
                  className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    issue.status === "incompatible"
                      ? "bg-builder-danger"
                      : "bg-builder-warning"
                  }`}
                />
                <span className="text-white/60">{issue.message}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {displayIssues.length === 0 && displayHasComponents && (
          <p className="mt-3 text-xs text-builder-success/80">
            Todos los componentes seleccionados son compatibles entre sí.
          </p>
        )}
      </div>

      {/* Copy build */}
      {displayHasComponents && (
        <button
          onClick={handleCopy}
          className={`flex w-full items-center justify-center gap-2 rounded-xl
                     px-4 py-2.5 text-sm font-medium transition-colors
                     ${
                       copied
                         ? "bg-builder-success/10 text-builder-success"
                         : "bg-[#0E79B2] text-[#FBFEF9] hover:bg-[#0A5C87]"
                     }`}
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              ¡Copiado! ✓
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copiar configuración
            </>
          )}
        </button>
      )}

      {/* Clear build */}
      {displayHasComponents && (
        <button
          onClick={onClearBuild}
          className="w-full rounded-xl border border-white/10 bg-white/5
                     px-4 py-2.5 text-sm font-medium text-white/60
                     transition-colors hover:border-builder-danger/40
                     hover:text-builder-danger"
        >
          Limpiar configuración
        </button>
      )}
    </aside>
  );
}
