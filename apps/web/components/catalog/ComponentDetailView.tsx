import Link from "next/link";
import { AddToBuildButton } from "@/components/catalog/AddToBuildButton";
import { ComponentImage } from "@/components/catalog/ComponentImage";
import { CompareButton } from "@/components/compare/CompareButton";
import { buttonClassName } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/categories";
import {
  formatPrice,
  getComponentPriceLabel,
  getOfferPrice,
  sortStoreOffers,
} from "@/lib/components/pricing";
import {
  getStockLabel,
  getTechnicalSpecifications,
} from "@/lib/components/specifications";
import type { PCComponent } from "@/types/component";

interface ComponentDetailViewProps {
  component: PCComponent;
}

function formatOfferUpdate(value?: string): string {
  if (!value) return "Fecha no informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no informada";
  return `Actualizado ${date.toLocaleDateString("es-CL")}`;
}

export function ComponentDetailView({
  component,
}: ComponentDetailViewProps) {
  const specifications = getTechnicalSpecifications(component);
  const categoryLabel = CATEGORY_LABELS[component.category];
  const offers = sortStoreOffers(component.offers ?? []);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden px-2 py-8 sm:px-4 md:py-12">
      <Link
        href="/components"
        className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-white/70 transition-colors hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
      >
        Volver a componentes
      </Link>

      <article className="mt-4 min-w-0 max-w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/5 bg-white/5">
            <ComponentImage
              src={component.image}
              alt={`${component.name} de ${component.brand}`}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-contain p-6 sm:p-10"
              priority
              fallback={
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#38BDF8]">
                    {categoryLabel}
                  </p>
                  <p className="mt-2 text-lg font-medium text-white/50">
                    {component.brand}
                  </p>
                </div>
              }
            />
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
                {getComponentPriceLabel(component)}
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
              <CompareButton
                component={component}
                source="detail"
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        {offers.length > 0 && (
          <section
            aria-labelledby="store-offers"
            className="min-w-0 max-w-full overflow-hidden border-t border-white/10 p-5 sm:p-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="store-offers" className="text-2xl font-bold text-[#FBFEF9]">
                  Precios por tienda
                </h2>
                <p className="mt-2 text-sm text-white/55">
                  Compara disponibilidad y precio antes de comprar.
                </p>
              </div>
              <p className="text-sm text-white/45">
                {offers.length} {offers.length === 1 ? "oferta" : "ofertas"}
              </p>
            </div>

            <ul className="mt-6 space-y-3 lg:hidden">
              {offers.map((offer) => {
                const effectivePrice = getOfferPrice(offer);
                return (
                  <li
                    key={offer.storeId}
                    className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#FBFEF9]">
                          {offer.storeName}
                        </p>
                        <p className="mt-1 text-xl font-bold tabular-nums text-[#FBFEF9]">
                          {effectivePrice ? formatPrice(effectivePrice) : "Sin precio"}
                        </p>
                        {offer.priceCash && offer.priceNormal && offer.priceCash !== offer.priceNormal ? (
                          <p className="mt-1 text-xs text-white/45">
                            Normal {formatPrice(offer.priceNormal)}
                          </p>
                        ) : null}
                      </div>
                      <span className={offer.inStock ? "text-sm text-emerald-300" : "text-sm text-red-300"}>
                        {offer.inStock ? "Disponible" : "Sin stock"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-white/50">
                      {formatOfferUpdate(offer.updatedAt)}
                    </p>
                    {offer.productUrl ? (
                      <a
                        href={offer.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClassName("secondary", "mt-4 min-h-11 w-full px-4 py-2 text-sm")}
                      >
                        Ver tienda
                        <span className="sr-only"> {offer.storeName} (abre en una pestaña nueva)</span>
                      </a>
                    ) : (
                      <p className="mt-4 text-sm text-white/35">Sin enlace</p>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 hidden w-full max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-white/10 lg:block">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/50">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Tienda</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Precio</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Disponibilidad</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Verificación</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Enlace</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => {
                    const effectivePrice = getOfferPrice(offer);
                    return (
                      <tr key={offer.storeId} className="border-t border-white/10">
                        <th scope="row" className="px-4 py-4 font-semibold text-[#FBFEF9]">
                          {offer.storeName}
                        </th>
                        <td className="px-4 py-4 tabular-nums">
                          <p className="font-bold text-[#FBFEF9]">
                            {effectivePrice ? formatPrice(effectivePrice) : "Sin precio"}
                          </p>
                          {offer.priceCash && offer.priceNormal && offer.priceCash !== offer.priceNormal ? (
                            <p className="mt-1 text-xs text-white/45">
                              Normal {formatPrice(offer.priceNormal)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <span className={offer.inStock ? "text-emerald-300" : "text-red-300"}>
                            {offer.inStock ? "Disponible" : "Sin stock"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-white/50">
                          {formatOfferUpdate(offer.updatedAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {offer.productUrl ? (
                            <a
                              href={offer.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonClassName("secondary", "min-h-11 px-4 py-2 text-sm")}
                            >
                              Ver tienda
                              <span className="sr-only"> {offer.storeName} (abre en una pestaña nueva)</span>
                            </a>
                          ) : (
                            <span className="text-sm text-white/35">Sin enlace</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
