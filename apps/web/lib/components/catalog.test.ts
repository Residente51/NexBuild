import { describe, expect, it } from "vitest";
import {
  EMPTY_CATALOG_FILTERS,
  filterAndSortCatalog,
  getCatalogBrands,
  parseCatalogSearchParams,
  serializeCatalogFilters,
  updateCatalogSearchParams,
  type CatalogFilters,
} from "@/lib/components/catalog";
import type { PCComponent } from "@/types/component";

const catalog: PCComponent[] = [
  {
    id: "cpu-amd",
    slug: "amd-ryzen-7-7700",
    name: "Ryzen 7 7700",
    brand: "AMD",
    category: "cpu",
    price: 319_990,
    description: "Procesador eficiente para gaming",
    inStock: true,
    specs: {
      socket: "AM5",
      tdp: 65,
      hasIntegratedGraphics: true,
      includesCooler: true,
      cores: 8,
    },
  },
  {
    id: "cpu-intel",
    slug: "intel-core-i5-14400f",
    name: "Core i5 14400F",
    brand: "Intel",
    category: "cpu",
    price: 219_990,
    inStock: false,
    specs: {
      socket: "LGA1700",
      tdp: 65,
      hasIntegratedGraphics: false,
      includesCooler: true,
      cores: 10,
    },
  },
  {
    id: "gpu-nvidia",
    slug: "asus-geforce-rtx-4070",
    name: "GeForce RTX 4070 Dual",
    brand: "ASUS",
    category: "gpu",
    price: 649_990,
    inStock: true,
    specs: {
      length: 267,
      slotWidth: 2.5,
      recommendedPsuWattage: 650,
      vram: 12,
      memoryType: "GDDR6X",
    },
  },
  {
    id: "ram-corsair",
    slug: "corsair-vengeance-32gb",
    name: "Vengeance 32GB",
    brand: "Corsair",
    category: "ram",
    price: 119_990,
    inStock: true,
    specs: {
      ramType: "ddr5",
      modules: 2,
      capacityPerModule: 16,
      speed: 6_000,
    },
  },
];

function filters(overrides: Partial<CatalogFilters>): CatalogFilters {
  return { ...EMPTY_CATALOG_FILTERS, ...overrides };
}

describe("Catalog 2.0 filtering", () => {
  it("busca por nombre, marca, categoría y especificaciones", () => {
    expect(filterAndSortCatalog(catalog, filters({ q: "ryzen" }))).toHaveLength(1);
    expect(filterAndSortCatalog(catalog, filters({ q: "corsair" }))[0].id).toBe("ram-corsair");
    expect(filterAndSortCatalog(catalog, filters({ q: "tarjeta grafica" }))[0].id).toBe("gpu-nvidia");
    expect(filterAndSortCatalog(catalog, filters({ q: "gddr6x" }))[0].id).toBe("gpu-nvidia");
  });

  it("filtra por categoría", () => {
    expect(filterAndSortCatalog(catalog, filters({ category: "cpu" })).map((item) => item.id))
      .toEqual(["cpu-intel", "cpu-amd"]);
  });

  it("deriva y filtra marcas reales sin distinguir mayúsculas", () => {
    expect(getCatalogBrands(catalog)).toEqual(["AMD", "ASUS", "Corsair", "Intel"]);
    expect(filterAndSortCatalog(catalog, filters({ brand: "amd" })).map((item) => item.id))
      .toEqual(["cpu-amd"]);
  });

  it("aplica precios mínimo y máximo inclusivos", () => {
    expect(
      filterAndSortCatalog(catalog, filters({ minPrice: 200_000, maxPrice: 400_000 }))
        .map((item) => item.id),
    ).toEqual(["cpu-intel", "cpu-amd"]);
  });

  it("distingue productos con stock y sin stock", () => {
    expect(filterAndSortCatalog(catalog, filters({ stock: "out" })).map((item) => item.id))
      .toEqual(["cpu-intel"]);
    expect(filterAndSortCatalog(catalog, filters({ stock: "in" }))).toHaveLength(3);
  });

  it("ordena de forma determinista por precio y nombre", () => {
    expect(filterAndSortCatalog(catalog, filters({ sort: "price-asc" })).map((item) => item.id))
      .toEqual(["ram-corsair", "cpu-intel", "cpu-amd", "gpu-nvidia"]);
    expect(filterAndSortCatalog(catalog, filters({ sort: "price-desc" })).map((item) => item.id))
      .toEqual(["gpu-nvidia", "cpu-amd", "cpu-intel", "ram-corsair"]);
    expect(filterAndSortCatalog(catalog, filters({ sort: "name-asc" })).map((item) => item.id))
      .toEqual(["cpu-intel", "gpu-nvidia", "cpu-amd", "ram-corsair"]);
  });

  it("combina búsqueda, categoría, marca, precio y stock", () => {
    const result = filterAndSortCatalog(catalog, filters({
      q: "am5 gaming",
      category: "cpu",
      brand: "AMD",
      minPrice: 300_000,
      maxPrice: 350_000,
      stock: "in",
    }));

    expect(result.map((item) => item.id)).toEqual(["cpu-amd"]);
  });

  it("devuelve cero resultados sin alterar el catálogo", () => {
    expect(filterAndSortCatalog(catalog, filters({ q: "threadripper inexistente" })))
      .toEqual([]);
    expect(catalog).toHaveLength(4);
  });
});

describe("Catalog 2.0 search params", () => {
  it("ignora parámetros inválidos y desconocidos de forma segura", () => {
    const params = new URLSearchParams(
      "category=televisor&minPrice=-1&maxPrice=abc&stock=maybe&sort=random&unknown=yes",
    );

    expect(parseCatalogSearchParams(params)).toEqual(EMPTY_CATALOG_FILTERS);
    expect(
      parseCatalogSearchParams(new URLSearchParams("minPrice=500000&maxPrice=100000")),
    ).toEqual(EMPTY_CATALOG_FILTERS);
  });

  it("serializa y restaura el estado compartible del catálogo", () => {
    const expected: CatalogFilters = {
      q: "ryzen",
      category: "cpu",
      brand: "AMD",
      minPrice: 100_000,
      maxPrice: 500_000,
      stock: "in",
      sort: "price-asc",
    };
    const serialized = serializeCatalogFilters(expected);

    expect(serialized.toString()).toBe(
      "q=ryzen&category=cpu&brand=AMD&minPrice=100000&maxPrice=500000&stock=in&sort=price-asc",
    );
    expect(parseCatalogSearchParams(serialized)).toEqual(expected);
  });

  it("el reset elimina todos los filtros conocidos", () => {
    const current = new URLSearchParams("q=ryzen&brand=AMD&stock=in&sort=price-desc");
    const reset = serializeCatalogFilters(EMPTY_CATALOG_FILTERS);

    expect(reset.toString()).toBe("");
    expect(updateCatalogSearchParams(current, {
      q: undefined,
      brand: undefined,
      stock: undefined,
      sort: undefined,
    }).toString()).toBe("");
  });
});
