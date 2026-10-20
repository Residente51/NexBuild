import type {
  BuildSelection,
  PCComponent,
  StoreOffer,
} from "@/types/component";

export function isValidPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function getOfferPrice(offer: StoreOffer): number | null {
  if (isValidPrice(offer.priceCash)) return offer.priceCash;
  if (isValidPrice(offer.priceNormal)) return offer.priceNormal;
  return null;
}

export function getValidOffers(offers: StoreOffer[]): StoreOffer[] {
  return offers.filter((offer) => getOfferPrice(offer) !== null);
}

export function sortStoreOffers(offers: StoreOffer[]): StoreOffer[] {
  return [...getValidOffers(offers)].sort((left, right) => {
    if (left.inStock !== right.inStock) return left.inStock ? -1 : 1;

    const priceDifference =
      (getOfferPrice(left) ?? Number.MAX_SAFE_INTEGER) -
      (getOfferPrice(right) ?? Number.MAX_SAFE_INTEGER);
    if (priceDifference !== 0) return priceDifference;

    return (
      left.storeName.localeCompare(right.storeName, "es-CL") ||
      left.storeId.localeCompare(right.storeId, "es-CL")
    );
  });
}

export function getAvailableOffers(offers: StoreOffer[]): StoreOffer[] {
  return sortStoreOffers(offers).filter((offer) => offer.inStock);
}

export function getBestOffer(offers: StoreOffer[]): StoreOffer | null {
  return getAvailableOffers(offers)[0] ?? null;
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-CL")}`;
}

export function getComponentPriceLabel(component: PCComponent): string {
  if (component.offers) {
    const offers = getAvailableOffers(component.offers);
    const bestPrice = offers[0] ? getOfferPrice(offers[0]) : null;
    if (bestPrice === null) return "Sin oferta disponible";
    return `${offers.length > 1 ? "Desde " : ""}${formatPrice(bestPrice)}`;
  }

  if (component.inStock === false || !isValidPrice(component.price)) {
    return "Sin oferta disponible";
  }

  return formatPrice(component.price);
}

function getSelectedComponents(build: BuildSelection): PCComponent[] {
  return [
    build.cpu,
    build.motherboard,
    build.ram,
    build.gpu,
    build.case,
    build.cooler,
    build.psu,
    ...build.storage,
  ].filter((component): component is PCComponent => Boolean(component));
}

export interface MinimumBuildTotal {
  total: number;
  isComplete: boolean;
  missingPriceComponents: PCComponent[];
}

export function calculateMinimumBuildTotal(
  build: BuildSelection,
): MinimumBuildTotal {
  const missingPriceComponents: PCComponent[] = [];
  let total = 0;

  for (const component of getSelectedComponents(build)) {
    const offer = component.offers ? getBestOffer(component.offers) : null;
    const price = offer ? getOfferPrice(offer) : component.price;
    const isAvailable = component.offers
      ? offer !== null
      : component.inStock !== false;

    if (!isAvailable || !isValidPrice(price)) {
      missingPriceComponents.push(component);
      continue;
    }

    total += price;
  }

  return {
    total,
    isComplete: missingPriceComponents.length === 0,
    missingPriceComponents,
  };
}
