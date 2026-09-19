"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CompareButton } from "@/components/compare/CompareButton";
import { buttonClassName } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getCatalogSpecBadges } from "@/lib/components/catalog";
import type { PCComponent } from "@/types/component";

interface CatalogItemCardProps {
  component: PCComponent;
  isAdded: boolean;
  onAdd: (component: PCComponent) => void;
}

export function CatalogItemCard({
  component,
  isAdded,
  onAdd,
}: CatalogItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const specs = getCatalogSpecBadges(component);
  const isUnavailable = component.inStock === false;

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-[transform,border-color,box-shadow] duration-150 motion-reduce:transition-none motion-reduce:hover:transform-none hover:-translate-y-1 hover:border-[#0E79B2]/50 hover:shadow-lg hover:shadow-black/20">
      <div>
        <div className="mb-4 flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/5">
          {component.image && !imageFailed ? (
            <Image
              src={component.image}
              alt={`${component.name} de ${component.brand}`}
              width={144}
              height={144}
              unoptimized
              className="h-full w-full object-contain p-2 transition-transform duration-150 motion-reduce:transition-none group-hover:scale-105 motion-reduce:group-hover:scale-100"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {CATEGORY_LABELS[component.category]}
              </span>
              <span className="mt-1 text-xs font-medium text-zinc-500">
                {component.brand}
              </span>
            </>
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
