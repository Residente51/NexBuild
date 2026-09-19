"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CompareButton } from "@/components/compare/CompareButton";
import { buttonClassName } from "@/components/ui/Button";
import { CATEGORY_LABELS, type ComponentCategory } from "@/lib/categories";
import { getCatalogSpecBadges } from "@/lib/components/catalog";
import type { PCComponent } from "@/types/component";

interface CatalogItemCardProps {
  component: PCComponent;
  isAdded: boolean;
  onAdd: (component: PCComponent) => void;
  prioritizeImage?: boolean;
}

const CATEGORY_MARKS: Record<ComponentCategory, string> = {
  cpu: "CPU",
  gpu: "GPU",
  ram: "RAM",
  storage: "SSD",
  motherboard: "MB",
  case: "CASE",
  cooler: "COOL",
  psu: "PSU",
};

function CatalogImageFallback({ component }: { component: PCComponent }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(14,121,178,0.18),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-8 bottom-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="flex h-16 min-w-16 items-center justify-center rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/10 px-3 shadow-[0_12px_36px_rgba(0,0,0,0.28)]">
          <span className="text-sm font-black tracking-[0.16em] text-sky-200">
            {CATEGORY_MARKS[component.category]}
          </span>
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
          {CATEGORY_LABELS[component.category]}
        </p>
        <p className="mt-1 text-xs font-medium text-white/35">
          {component.brand}
        </p>
      </div>
    </div>
  );
}

export function CatalogItemCard({
  component,
  isAdded,
  onAdd,
  prioritizeImage = false,
}: CatalogItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const specs = getCatalogSpecBadges(component);
  const isUnavailable = component.inStock === false;

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-[transform,border-color,box-shadow] duration-150 motion-reduce:transition-none motion-reduce:hover:transform-none hover:-translate-y-1 hover:border-[#0E79B2]/50 hover:shadow-lg hover:shadow-black/20">
      <div>
        <div className="relative mb-5 h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111119] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:h-52">
          {component.image && !imageFailed ? (
            <div className="relative h-full w-full">
              <Image
                src={component.image}
                alt={`${component.name} de ${component.brand}`}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                unoptimized
                loading={prioritizeImage ? "eager" : "lazy"}
                className="object-contain p-1 drop-shadow-[0_16px_24px_rgba(0,0,0,0.38)] transition-transform duration-200 ease-out motion-reduce:transition-none group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                onError={() => setImageFailed(true)}
              />
            </div>
          ) : (
            <CatalogImageFallback component={component} />
          )}
        </div>

        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-white/45">
            {component.brand}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              isUnavailable
                ? "bg-red-400/10 text-red-300"
                : "bg-emerald-400/10 text-emerald-300"
            }`}
          >
            {isUnavailable ? "Sin stock" : "Disponible"}
          </span>
        </div>

        <h2 className="text-base font-bold leading-tight text-[#FBFEF9]">
          {component.name}
        </h2>

        {component.description && (
          <p
            className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400"
            title={component.description}
          >
            {component.description}
          </p>
        )}

        {specs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Especificaciones destacadas">
            {specs.map((specification) => (
              <span
                key={specification}
                className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-400"
              >
                {specification}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-white/5 pt-4">
        <p className="text-lg font-bold tabular-nums text-[#FBFEF9]">
          {component.price > 0
            ? `$${component.price.toLocaleString("es-CL")}`
            : "Sin precio"}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/components/${component.slug}`}
            className={buttonClassName("secondary", "w-full px-3 py-2 text-sm")}
          >
            Ver detalles
          </Link>

          <button
            type="button"
            onClick={() => onAdd(component)}
            disabled={isAdded || isUnavailable}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] disabled:cursor-not-allowed ${
              isUnavailable
                ? "bg-white/5 text-white/35"
                : isAdded
                  ? "bg-[#34D399]/20 text-[#34D399]"
                  : "bg-[#0E79B2] text-white hover:bg-[#0A5C87]"
            }`}
          >
            {isUnavailable ? "No disponible" : isAdded ? "Añadido" : "Añadir"}
          </button>

          <CompareButton component={component} className="col-span-2" />

          {component.productUrl && (
            <a
              href={component.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName(
                "secondary",
                "col-span-2 w-full px-3 py-2 text-sm",
              )}
            >
              Ver oferta
              <span className="sr-only"> para {component.name} (abre en una pestaña nueva)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
