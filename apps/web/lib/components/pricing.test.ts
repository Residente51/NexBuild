import { describe, expect, it } from "vitest";
import {
  calculateMinimumBuildTotal,
  getBestOffer,
  getComponentPriceLabel,
  getOfferPrice,
  sortStoreOffers,
} from "@/lib/components/pricing";
import type {
  CPUComponent,
  StorageComponent,
  StoreOffer,
} from "@/types/component";

const offers: StoreOffer[] = [
  {
    storeId: "normal-only",
    storeName: "Normal",
    priceNormal: 130_000,
    inStock: true,
  },
  {
    storeId: "cash",
    storeName: "Efectivo",
    priceCash: 110_000,
    priceNormal: 120_000,
    inStock: true,
  },
  {
    storeId: "sold-out",
    storeName: "Agotada",
    priceCash: 90_000,
    inStock: false,
  },
];

const cpu: CPUComponent = {
  id: "cpu-1",
  slug: "test-cpu",
  name: "Test CPU",
  brand: "Test",
  category: "cpu",
  price: 110_000,
  inStock: true,
  offers,
  specs: {
    socket: "AM5",
    tdp: 65,
    hasIntegratedGraphics: true,
    includesCooler: true,
  },
};

describe("store pricing", () => {
  it("prioriza efectivo y usa precio normal como respaldo", () => {
    expect(getOfferPrice(offers[1])).toBe(110_000);
    expect(getOfferPrice(offers[0])).toBe(130_000);
  });

  it("ordena ofertas disponibles por precio antes que agotadas", () => {
    expect(sortStoreOffers(offers).map((offer) => offer.storeId)).toEqual([
      "cash",
      "normal-only",
      "sold-out",
    ]);
    expect(getBestOffer(offers)?.storeId).toBe("cash");
  });

  it("muestra Desde cuando hay más de una oferta disponible", () => {
    expect(getComponentPriceLabel(cpu)).toBe("Desde $110.000");
  });

  it("calcula el total mínimo y avisa precios faltantes", () => {
    const missing: StorageComponent = {
      id: "storage-1",
      slug: "storage-sin-precio",
      name: "Sin precio",
      brand: "Test",
      category: "storage",
      price: 0,
      offers: [],
      specs: {
        type: "nvme",
        formFactor: "m.2 2280",
        capacity: 1_000,
      },
    };
    const result = calculateMinimumBuildTotal({
      cpu,
      storage: [missing],
    });

    expect(result.total).toBe(110_000);
    expect(result.isComplete).toBe(false);
    expect(result.missingPriceComponents.map((component) => component.name)).toEqual([
      "Sin precio",
    ]);
  });
});
