import Image from "next/image";
import Link from "next/link";
import { AddToBuildButton } from "@/components/catalog/AddToBuildButton";
import { buttonClassName } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { PCComponent } from "@/types/component";

interface ComponentDetailViewProps {
  component: PCComponent;
}

interface TechnicalSpecification {
  label: string;
  value: string;
}

function formatNumber(value: number): string {
  return value.toLocaleString("es-CL");
}

function formatCapacity(value: number): string {
  if (value < 1_000) return `${formatNumber(value)} GB`;

  return `${(value / 1_000).toLocaleString("es-CL", {
    maximumFractionDigits: 2,
  })} TB`;
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "No especificado";
}

function getTechnicalSpecifications(
  component: PCComponent,
): TechnicalSpecification[] {
  switch (component.category) {
    case "cpu": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        ...(specs.cores
          ? [{ label: "Núcleos", value: formatNumber(specs.cores) }]
          : []),
        { label: "Socket", value: specs.socket },
        { label: "TDP", value: `${formatNumber(specs.tdp)} W` },
        {
          label: "Gráficos integrados",
          value: specs.hasIntegratedGraphics ? "Sí" : "No",
        },
        {
          label: "Refrigeración incluida",
          value: specs.includesCooler ? "Sí" : "No",
        },
      ];
    }

    case "motherboard": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        ...(specs.chipset
          ? [{ label: "Chipset", value: specs.chipset }]
          : []),
        { label: "Socket", value: specs.socket },
        { label: "Formato", value: specs.formFactor.toUpperCase() },
        { label: "Tipo de memoria", value: specs.ramType.toUpperCase() },
        { label: "Ranuras RAM", value: formatNumber(specs.ramSlots) },
        { label: "Ranuras M.2", value: formatNumber(specs.m2Slots) },
        { label: "Puertos SATA", value: formatNumber(specs.sataPorts) },
      ];
    }

    case "ram": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Tipo de memoria", value: specs.ramType.toUpperCase() },
        { label: "Módulos", value: formatNumber(specs.modules) },
        {
          label: "Capacidad por módulo",
          value: `${formatNumber(specs.capacityPerModule)} GB`,
        },
        ...(specs.speed
          ? [{ label: "Velocidad", value: `${formatNumber(specs.speed)} MHz` }]
          : []),
      ];
    }

    case "gpu": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        ...(specs.vram
          ? [{ label: "VRAM", value: `${formatNumber(specs.vram)} GB` }]
          : []),
        ...(specs.memoryType
          ? [{ label: "Tipo de memoria", value: specs.memoryType }]
          : []),
        { label: "Largo", value: `${formatNumber(specs.length)} mm` },
        { label: "Ancho", value: `${formatNumber(specs.slotWidth)} slots` },
        ...(specs.powerDraw
          ? [{ label: "Consumo", value: `${formatNumber(specs.powerDraw)} W` }]
          : []),
        ...(specs.tdp
          ? [{ label: "TDP", value: `${formatNumber(specs.tdp)} W` }]
          : []),
        {
          label: "Fuente recomendada",
          value: `${formatNumber(specs.recommendedPsuWattage)} W`,
        },
      ];
    }

    case "storage": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Tipo", value: specs.type.toUpperCase() },
        { label: "Formato", value: specs.formFactor.toUpperCase() },
        { label: "Capacidad", value: formatCapacity(specs.capacity) },
        ...(specs.readSpeed
          ? [
              {
                label: "Velocidad de lectura",
                value: `${formatNumber(specs.readSpeed)} MB/s`,
              },
            ]
          : []),
      ];
    }

    case "psu": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Potencia", value: `${formatNumber(specs.wattage)} W` },
        { label: "Formato", value: specs.formFactor.toUpperCase() },
        ...(specs.certification
          ? [{ label: "Certificación", value: specs.certification }]
          : []),
      ];
    }

    case "case": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        {
          label: "Placas madre compatibles",
          value: formatList(specs.supportedMotherboards),
        },
        {
          label: "Largo máximo de GPU",
          value: `${formatNumber(specs.maxGpuLength)} mm`,
        },
        ...(specs.maxGpuSlotWidth
          ? [
              {
                label: "Ancho máximo de GPU",
                value: `${formatNumber(specs.maxGpuSlotWidth)} slots`,
              },
            ]
          : []),
        {
          label: "Altura máxima del cooler",
          value: `${formatNumber(specs.maxCoolerHeight)} mm`,
        },
        {
          label: "Formatos de fuente",
          value: formatList(
            specs.supportedPsuFormFactors.map((value) => value.toUpperCase()),
          ),
        },
        {
          label: "Soporte de radiadores",
          value: formatList(specs.radiatorSupport),
        },
      ];
    }

    case "cooler": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Tipo", value: specs.type === "air" ? "Aire" : "AIO" },
        {
          label: "Sockets compatibles",
          value: formatList(specs.supportedSockets),
        },
        ...(specs.height
          ? [{ label: "Altura", value: `${formatNumber(specs.height)} mm` }]
          : []),
        ...(specs.radiatorSize
          ? [{ label: "Radiador", value: specs.radiatorSize }]
          : []),
      ];
    }
  }
}

function getStockLabel(component: PCComponent): string {
  if (component.inStock === true) return "Disponible";
  if (component.inStock === false) return "Sin stock";
  return "Disponibilidad no informada";
}

export function ComponentDetailView({
  component,
}: ComponentDetailViewProps) {
  const specifications = getTechnicalSpecifications(component);
  const categoryLabel = CATEGORY_LABELS[component.category];

  return (
    <div className="mx-auto max-w-6xl px-2 py-8 sm:px-4 md:py-12">
      <Link
        href="/components"
        className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-white/70 transition-colors hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
      >
        Volver a componentes
      </Link>

      <article className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/5 bg-white/5">
            {component.image ? (
              <Image
                src={component.image}
                alt={`${component.name} de ${component.brand}`}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                unoptimized
                className="object-contain p-6 sm:p-10"
                priority
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#38BDF8]">
                  {categoryLabel}
                </p>
                <p className="mt-2 text-lg font-medium text-white/50">
                  {component.brand}
                </p>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#38BDF8]">
              {categoryLabel}
            </p>
            <p className="mt-3 text-base font-medium text-white/60">
              {component.brand}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[#FBFEF9] sm:text-4xl lg:text-5xl">
              {component.name}
            </h1>

            {component.description && (
              <p className="mt-5 max-w-[65ch] leading-relaxed text-white/65">
                {component.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <p className="text-3xl font-black tabular-nums text-[#FBFEF9]">
                {component.price > 0
                  ? `$${component.price.toLocaleString("es-CL")}`
                  : "Sin precio"}
              </p>
              <span
                className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold ${
                  component.inStock === true
                    ? "bg-emerald-400/10 text-emerald-300"
                    : component.inStock === false
                      ? "bg-red-400/10 text-red-300"
                      : "bg-white/5 text-white/60"
                }`}
              >
                {getStockLabel(component)}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AddToBuildButton component={component} />
              {component.productUrl && (
                <a
                  href={component.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName("secondary", "w-full sm:w-auto")}
                >
                  Ver oferta
                </a>
              )}
            </div>
          </div>
        </div>

        <section
          aria-labelledby="technical-specifications"
          className="border-t border-white/10 p-5 sm:p-8"
        >
          <h2
            id="technical-specifications"
            className="text-2xl font-bold text-[#FBFEF9]"
          >
            Especificaciones técnicas
          </h2>

          {specifications.length > 0 ? (
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {specifications.map((specification) => (
                <div
                  key={specification.label}
                  className="rounded-xl border border-white/5 bg-black/15 p-4"
                >
                  <dt className="text-sm text-white/50">
                    {specification.label}
                  </dt>
                  <dd className="mt-1 font-semibold text-[#FBFEF9]">
                    {specification.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 text-white/60">
              No hay especificaciones técnicas disponibles.
            </p>
          )}
        </section>
      </article>
    </div>
  );
}
