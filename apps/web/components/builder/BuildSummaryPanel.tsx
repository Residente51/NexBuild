"use client";

import { useCallback, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { ComponentCategory } from "@/lib/categories";
import type { BuildProgress } from "@/lib/build/progress";
import { useBuildStore } from "@/store/useBuildStore";
import type {
  BuildCompatibilityReport,
  BuildSelection,
  CompatibilityIssue,
  CompatibilityStatus,
} from "@/types/component";

const STATUS_LABELS: Record<CompatibilityStatus, string> = {
  compatible: "Compatible",
  warning: "Con advertencias",
  incompatible: "Incompatible",
  unknown: "Sin determinar",
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
    label: "Con advertencias",
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
  unknown: {
    label: "Sin determinar",
    dotClass: "bg-white/35",
    bgClass: "bg-white/5",
    borderClass: "border-white/20",
  },
};

const ISSUE_GROUPS: Array<{
  status: CompatibilityIssue["status"];
  label: string;
  colorClass: string;
  dotClass: string;
  surfaceClass: string;
}> = [
  {
    status: "incompatible",
    label: "Errores de compatibilidad",
    colorClass: "text-builder-danger",
    dotClass: "bg-builder-danger",
    surfaceClass: "border-builder-danger/20 bg-builder-danger/5",
  },
  {
    status: "warning",
    label: "Advertencias",
    colorClass: "text-builder-warning",
    dotClass: "bg-builder-warning",
    surfaceClass: "border-builder-warning/20 bg-builder-warning/5",
  },
  {
    status: "unknown",
    label: "Partes o datos pendientes",
    colorClass: "text-white/70",
    dotClass: "bg-white/40",
    surfaceClass: "border-white/10 bg-white/[0.03]",
  },
];

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
    if (component) {
      lines.push(
        `${CATEGORY_LABELS[slot as ComponentCategory]}: ${component.name} - $${component.price.toLocaleString("es-CL")}`,
      );
    }
  }

  for (const device of build.storage) {
    lines.push(
      `Almacenamiento: ${device.name} - $${device.price.toLocaleString("es-CL")}`,
    );
  }

  lines.push("");
  lines.push(`💰 Total estimado: $${totalPrice.toLocaleString("es-CL")} CLP`);
  lines.push(`⚙️ Estado: ${STATUS_LABELS[status]}`);

  return lines.join("\n");
}

interface BuildSummaryPanelProps {
  build: BuildSelection;
  totalPrice: number;
  selectedCount: number;
  report: BuildCompatibilityReport;
  progress: BuildProgress;
  onClearBuild: () => void;
  hasComponents: boolean;
}

export function BuildSummaryPanel({
  build,
  totalPrice,
  selectedCount,
  report,
  progress,
  onClearBuild,
  hasComponents,
}: BuildSummaryPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedUrlCopied, setSavedUrlCopied] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [savedBuildSignature, setSavedBuildSignature] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const saveBuildToCloud = useBuildStore((state) => state.saveBuildToCloud);

  const statusCfg = STATUS_CONFIG[report.status];
  const buildSignature = [
    ...EXPORT_SLOT_ORDER.map((slot) => build[slot]?.id ?? ""),
    ...build.storage.map((component) => component.id),
  ].join("|");
  const groupedIssues = ISSUE_GROUPS.map((group) => ({
    ...group,
    issues: report.issues.filter((issue) => issue.status === group.status),
  })).filter((group) => group.issues.length > 0);
  const psuWattage = build.psu?.specs?.wattage;
  const psuLoadPercentage = psuWattage
    ? Math.round((report.totalWattageEstimated / psuWattage) * 100)
    : null;
  const psuHeadroom = psuWattage
    ? psuWattage - report.totalWattageEstimated
    : null;
  const powerIssue = report.issues.find((issue) =>
    [
      "PSU_WATTAGE_EXCEEDED",
      "PSU_BELOW_GPU_RECOMMENDATION",
      "PSU_WATTAGE_TIGHT",
    ].includes(issue.code),
  );
  const isReady =
    progress.isComplete &&
    report.status !== "unknown" &&
    report.status !== "incompatible";

  const handleCopy = useCallback(async () => {
    try {
      setActionError(null);
      await navigator.clipboard.writeText(
        generateBuildText(build, totalPrice, report.status),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("No pudimos copiar la configuración al portapapeles.");
    }
  }, [build, totalPrice, report.status]);

  const handleSaveToCloud = async () => {
    try {
      setIsSaving(true);
      setActionError(null);
      setSavedUrl(null);
      setSavedBuildSignature(null);
      const id = await saveBuildToCloud();
      if (id) {
        const url = `${window.location.origin}/build/${id}`;
        setSavedUrl(url);
        setSavedBuildSignature(buildSignature);
        try {
          await navigator.clipboard.writeText(url);
          setSavedUrlCopied(true);
          setTimeout(() => setSavedUrlCopied(false), 3000);
        } catch {
          setActionError(
            "La configuración se guardó, pero no pudimos copiar el enlace automáticamente.",
          );
        }
      }
    } catch (error) {
      console.error("Error al guardar en la nube:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Hubo un error al guardar la configuración.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside id="build-summary-panel" className="sticky top-6 space-y-5">
      <div
        role="status"
        className={`rounded-xl border p-5 ${
          isReady
            ? "border-builder-success/30 bg-builder-success/10"
            : report.status === "incompatible"
              ? "border-builder-danger/30 bg-builder-danger/10"
              : "border-white/10 bg-white/5"
        }`}
      >
        <p
          className={`text-sm font-bold ${
            isReady
              ? "text-builder-success"
              : report.status === "incompatible"
                ? "text-builder-danger"
                : "text-builder-text"
          }`}
        >
          {isReady
            ? report.status === "warning"
              ? "Armado completo con advertencias"
              : "Armado completo y compatible"
            : report.status === "incompatible"
              ? "El armado requiere ajustes"
              : progress.isComplete
                ? "Faltan datos para validar el armado"
                : "Armado en progreso"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/55">
          {progress.missingCategories.length > 0
            ? `Faltan ${progress.missingCategories.length} ${
                progress.missingCategories.length === 1
                  ? "parte requerida"
                  : "partes requeridas"
              }.`
            : report.status === "unknown"
              ? "La selección está completa, pero faltan datos para confirmar compatibilidad."
              : "Todas las partes requeridas están seleccionadas."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#0E79B2]/30 bg-[#0E79B2]/10 p-5">
          <p className="text-xs font-semibold tracking-wide text-[#7DD3FC] uppercase">
            Piezas
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#FBFEF9]">
            {selectedCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#0E79B2]/30 bg-[#0E79B2]/10 p-5">
          <p className="text-xs font-semibold tracking-wide text-[#7DD3FC] uppercase">
            Precio total
          </p>
          <p className="mt-2 text-xl font-black tracking-tight tabular-nums text-[#FBFEF9] sm:text-2xl">
            ${totalPrice.toLocaleString("es-CL")}
          </p>
          <p className="mt-1 text-xs text-white/45">CLP</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          Energía estimada
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-white/45">Consumo</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-builder-text">
              ~{report.totalWattageEstimated}W
            </p>
          </div>
          <div>
            <p className="text-xs text-white/45">Fuente</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-builder-text">
              {psuWattage ? `${psuWattage}W` : "Pendiente"}
            </p>
          </div>
        </div>

        {psuLoadPercentage != null && psuHeadroom != null ? (
          <>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
              role="meter"
              aria-label="Uso estimado de la capacidad de la fuente"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(psuLoadPercentage, 100)}
            >
              <div
                className={`h-full rounded-full ${
                  powerIssue?.status === "incompatible"
                    ? "bg-builder-danger"
                    : powerIssue?.status === "warning"
                      ? "bg-builder-warning"
                      : "bg-builder-success"
                }`}
                style={{ width: `${Math.min(psuLoadPercentage, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/50">
              <span>{psuLoadPercentage}% de carga estimada</span>
              <span className="tabular-nums">
                {psuHeadroom >= 0
                  ? `${psuHeadroom}W de margen`
                  : `${Math.abs(psuHeadroom)}W de déficit`}
              </span>
            </div>
            {build.gpu?.specs?.recommendedPsuWattage ? (
              <p className="mt-3 text-xs text-white/50">
                Recomendación de la GPU: {build.gpu.specs.recommendedPsuWattage}W.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-white/50">
            Selecciona una fuente con potencia informada para ver el margen disponible.
          </p>
        )}
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {actionError}
        </p>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
            Compatibilidad
          </p>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusCfg.bgClass} ${statusCfg.borderClass}`}
          >
            <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${statusCfg.dotClass}`} />
            <span className="text-builder-text">{statusCfg.label}</span>
          </div>
        </div>

        {groupedIssues.length > 0 ? (
          <div className="mt-4 space-y-3" aria-live="polite">
            {groupedIssues.map((group) => (
              <section
                key={group.status}
                aria-labelledby={`compatibility-${group.status}`}
                className={`rounded-lg border p-3 ${group.surfaceClass}`}
              >
                <h3
                  id={`compatibility-${group.status}`}
                  className={`text-xs font-bold ${group.colorClass}`}
                >
                  {group.label} ({group.issues.length})
                </h3>
                <ul className="mt-2 space-y-2">
                  {group.issues.map((issue) => (
                    <li
                      key={issue.code}
                      className="flex items-start gap-2 text-xs leading-relaxed text-white/60"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${group.dotClass}`}
                      />
                      <span>{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : hasComponents ? (
          <p className="mt-4 text-xs leading-relaxed text-builder-success">
            No se detectaron problemas entre los componentes seleccionados.
          </p>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-white/50">
            Agrega componentes para comenzar la validación.
          </p>
        )}
      </div>

      {hasComponents && (
        <>
          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] disabled:cursor-wait disabled:opacity-50 ${
              savedUrlCopied
                ? "bg-builder-success/15 text-builder-success"
                : isReady
                  ? "bg-[#0E79B2] text-[#FBFEF9] hover:bg-[#0A5C87]"
                  : "border border-white/20 bg-white/5 text-[#FBFEF9] hover:bg-white/10"
            }`}
          >
            {isSaving
              ? "Guardando..."
              : savedUrlCopied
                ? "¡Enlace copiado!"
                : isReady
                  ? "Guardar y compartir armado"
                  : "Guardar avance en la nube"}
          </button>

          {savedUrl && savedBuildSignature === buildSignature && (
            <div
              className="rounded-xl border border-builder-success/30 bg-builder-success/10 p-4"
              role="status"
            >
              <p className="text-xs font-medium text-builder-success">
                Enlace compartible creado
              </p>
              <a
                href={savedUrl}
                className="mt-2 block break-all text-xs text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
              >
                {savedUrl}
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            aria-live="polite"
            className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] ${
              copied
                ? "border-builder-success/30 bg-builder-success/10 text-builder-success"
                : "border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {copied ? "¡Configuración copiada!" : "Copiar configuración"}
          </button>

          <button
            type="button"
            onClick={onClearBuild}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-builder-danger/40 hover:text-builder-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
          >
            Limpiar configuración
          </button>
        </>
      )}
    </aside>
  );
}
