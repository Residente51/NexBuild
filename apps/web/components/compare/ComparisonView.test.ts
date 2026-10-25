import { describe, expect, it } from "vitest";
import {
  createComparisonRows,
  getLowestComparisonPrice,
  getPriceDifference,
  getVisibleComparisonRows,
  rowHasDifference,
} from "./ComparisonView";
import type { PCComponent, StoreOffer } from "@/types/component";

function offer(
  storeId: string,
  priceCash: number,
  inStock = true,
): StoreOffer {
  return {
    storeId,
    storeName: storeId,
    priceCash,
    inStock,
  };
}

function cpu(
  id: string,
  overrides: Partial<PCComponent> = {},
): PCComponent {
  return {
    id,
    slug: `cpu-${id}`,
    name: `CPU ${id}`,
    brand: "AMD",
    category: "cpu",
    price: 200_000,
    inStock: true,
    specs: {
      socket: "AM5",
      tdp: 65,
      hasIntegratedGraphics: true,
      includesCooler: true,
    },
    ...overrides,
  } as PCComponent;
}

describe("ComparisonView helpers", () => {
  it("oculta filas iguales y conserva las diferencias", () => {
    const rows = createComparisonRows([
      cpu("a"),
      cpu("b", { brand: "Intel", price: 225_000 }),
    ]);

    const visibleRows = getVisibleComparisonRows(rows, true);

    expect(visibleRows.every(rowHasDifference)).toBe(true);
    expect(visibleRows.map((row) => row.label)).toContain("Marca");
    expect(visibleRows.map((row) => row.label)).not.toContain("Socket");
  });

  it("compara el precio efectivo aunque las etiquetas Desde difieran", () => {
    const rows = createComparisonRows([
      cpu("a", { offers: [offer("uno", 180_000)] }),
      cpu("b", {
        offers: [offer("uno", 180_000), offer("dos", 190_000)],
      }),
    ]);
    const priceRow = rows.find((row) => row.label === "Mejor precio");

    expect(priceRow?.values).toEqual(["$180.000", "Desde $180.000"]);
    expect(priceRow && rowHasDifference(priceRow)).toBe(false);
  });

  it("calcula diferencias desde la mejor oferta disponible, no desde price", () => {
    const cheaper = cpu("a", {
      price: 300_000,
      offers: [offer("agotada", 150_000, false), offer("actual", 180_000)],
    });
    const expensive = cpu("b", {
      price: 100_000,
      offers: [offer("actual", 205_000)],
    });

    const lowestPrice = getLowestComparisonPrice([cheaper, expensive]);

    expect(lowestPrice).toBe(180_000);
    expect(getPriceDifference(cheaper, lowestPrice)).toBeNull();
    expect(getPriceDifference(expensive, lowestPrice)).toBe(25_000);
  });

  it("ignora componentes sin oferta disponible al calcular el mínimo", () => {
    const unavailable = cpu("a", {
      offers: [offer("agotada", 150_000, false)],
    });
    const available = cpu("b", { offers: [offer("actual", 190_000)] });

    expect(getLowestComparisonPrice([unavailable, available])).toBe(190_000);
    expect(getLowestComparisonPrice([unavailable])).toBeNull();
    expect(getPriceDifference(unavailable, 190_000)).toBeNull();
  });
});
