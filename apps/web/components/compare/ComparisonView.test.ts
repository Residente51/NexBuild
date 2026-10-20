import { describe, expect, it } from "vitest";
import {
  createComparisonRows,
  getLowestValidPrice,
  getPriceDifference,
  getVisibleComparisonRows,
  hasDifference,
} from "./ComparisonView";
import type { PCComponent } from "@/types/component";

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
  it("detecta filas diferentes y conserva las filas iguales", () => {
    const rows = createComparisonRows([
      cpu("a"),
      cpu("b", { brand: "Intel", price: 225_000 }),
    ]);

    expect(hasDifference(rows.find((row) => row.label === "Marca")!.values)).toBe(true);
    expect(hasDifference(rows.find((row) => row.label === "Socket")!.values)).toBe(false);
  });

  it("oculta filas iguales sin eliminar las diferencias", () => {
    const rows = createComparisonRows([
      cpu("a"),
      cpu("b", { brand: "Intel", price: 225_000 }),
    ]);

    const visibleRows = getVisibleComparisonRows(rows, true);

    expect(visibleRows.every((row) => hasDifference(row.values))).toBe(true);
    expect(visibleRows.map((row) => row.label)).toContain("Marca");
    expect(visibleRows.map((row) => row.label)).not.toContain("Socket");
  });

  it("calcula la diferencia frente al precio válido menor", () => {
    expect(getPriceDifference(225_000, 200_000)).toBe(25_000);
    expect(getPriceDifference(200_000, 200_000)).toBeNull();
  });

  it("ignora productos sin precio al calcular el mínimo y diferencias", () => {
    const noPrice = cpu("sin-precio", { price: 0 });
    const priced = cpu("con-precio", { price: 180_000 });

    expect(getLowestValidPrice([noPrice, priced])).toBe(180_000);
    expect(getLowestValidPrice([noPrice])).toBeNull();
    expect(getPriceDifference(noPrice.price, 180_000)).toBeNull();
  });

  it("encuentra el precio mínimo válido con dos a cuatro productos", () => {
    expect(getLowestValidPrice([cpu("a", { price: 210_000 }), cpu("b", { price: 190_000 })]))
      .toBe(190_000);
    expect(getLowestValidPrice([
      cpu("a", { price: 210_000 }),
      cpu("b", { price: 190_000 }),
      cpu("c", { price: 0 }),
      cpu("d", { price: 205_000 }),
    ])).toBe(190_000);
  });
});
