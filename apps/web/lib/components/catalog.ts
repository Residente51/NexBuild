import {
  CATEGORY_LABELS,
  COMPONENT_CATEGORIES,
  type ComponentCategory,
} from "@/lib/categories";
import type { PCComponent } from "@/types/component";

export const CATALOG_SORTS = [
  "default",
  "price-asc",
  "price-desc",
  "name-asc",
] as const;

export const CATALOG_STOCK_FILTERS = ["all", "in", "out"] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number];
export type CatalogStockFilter = (typeof CATALOG_STOCK_FILTERS)[number];

export interface CatalogFilters {
  q: string;
  category?: ComponentCategory;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  stock: CatalogStockFilter;
  sort: CatalogSort;
}

type SearchParamsInput = Pick<URLSearchParams, "get">;

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  q: "",
  stock: "all",
  sort: "default",
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .trim();
}

function parsePrice(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined;
  const price = Number(value);
  return Number.isSafeInteger(price) && price >= 0 ? price : undefined;
}

function isComponentCategory(value: string): value is ComponentCategory {
  return COMPONENT_CATEGORIES.some((category) => category === value);
}

function isCatalogSort(value: string): value is CatalogSort {
  return CATALOG_SORTS.some((sort) => sort === value);
}

function isStockFilter(value: string): value is CatalogStockFilter {
  return CATALOG_STOCK_FILTERS.some((stock) => stock === value);
}

export function parseCatalogSearchParams(
  searchParams: SearchParamsInput,
): CatalogFilters {
  const q = searchParams.get("q")?.trim().slice(0, 120) ?? "";
  const rawCategory = searchParams.get("category") ?? "";
  const brand = searchParams.get("brand")?.trim().slice(0, 100) || undefined;
  let minPrice = parsePrice(searchParams.get("minPrice"));
  let maxPrice = parsePrice(searchParams.get("maxPrice"));
  const rawStock = searchParams.get("stock") ?? "";
  const rawSort = searchParams.get("sort") ?? "";

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    minPrice = undefined;
    maxPrice = undefined;
  }

  return {
    q,
    category: isComponentCategory(rawCategory) ? rawCategory : undefined,
    brand,
    minPrice,
    maxPrice,
    stock: isStockFilter(rawStock) ? rawStock : "all",
    sort: isCatalogSort(rawSort) ? rawSort : "default",
  };
}

export function serializeCatalogFilters(filters: CatalogFilters): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (filters.q) searchParams.set("q", filters.q);
  if (filters.category) searchParams.set("category", filters.category);
  if (filters.brand) searchParams.set("brand", filters.brand);
  if (filters.minPrice !== undefined) {
    searchParams.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    searchParams.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.stock !== "all") searchParams.set("stock", filters.stock);
  if (filters.sort !== "default") searchParams.set("sort", filters.sort);

  return searchParams;
}

export function updateCatalogSearchParams(
  current: SearchParamsInput,
  patch: Partial<Record<keyof CatalogFilters, string | number | undefined>>,
): URLSearchParams {
  const filters = parseCatalogSearchParams(current);

  for (const [key, value] of Object.entries(patch)) {
    if (key === "q" || key === "brand") {
      Object.assign(filters, { [key]: String(value ?? "").trim() });
    } else if (key === "category") {
      filters.category = isComponentCategory(String(value))
        ? String(value) as ComponentCategory
        : undefined;
    } else if (key === "minPrice" || key === "maxPrice") {
      Object.assign(filters, {
        [key]: typeof value === "number" && value >= 0 ? value : undefined,
      });
    } else if (key === "stock") {
      filters.stock = isStockFilter(String(value)) ? String(value) as CatalogStockFilter : "all";
    } else if (key === "sort") {
      filters.sort = isCatalogSort(String(value)) ? String(value) as CatalogSort : "default";
    }
  }

  return serializeCatalogFilters(filters);
}

function collectSearchValues(value: unknown, values: string[]): void {
  if (value === null || value === undefined) return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    values.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectSearchValues(item, values));
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      values.push(key);
      collectSearchValues(child, values);
    }
  }
}

function getSearchFields(component: PCComponent) {
  const specifications: string[] = [];
  collectSearchValues(component.specs, specifications);

  return {
    name: normalizeText(component.name),
    brand: normalizeText(component.brand),
    category: normalizeText(
      `${component.category} ${CATEGORY_LABELS[component.category]}`,
    ),
    specifications: normalizeText(
      `${component.description ?? ""} ${specifications.join(" ")}`,
    ),
  };
}

function relevanceScore(component: PCComponent, query: string): number {
  if (!query) return 0;
  const fields = getSearchFields(component);
  let score = 0;

  if (fields.name === query) score += 120;
  else if (fields.name.startsWith(query)) score += 80;
  else if (fields.name.includes(query)) score += 50;

  if (fields.brand === query) score += 60;
  else if (fields.brand.startsWith(query)) score += 40;
  else if (fields.brand.includes(query)) score += 25;

  if (fields.category.includes(query)) score += 20;
  if (fields.specifications.includes(query)) score += 10;

  return score;
}

function compareNameThenId(a: PCComponent, b: PCComponent): number {
  return (
    a.name.localeCompare(b.name, "es-CL", { sensitivity: "base" }) ||
    a.id.localeCompare(b.id)
  );
}

export function filterAndSortCatalog(
  catalog: PCComponent[],
  filters: CatalogFilters,
): PCComponent[] {
  const query = normalizeText(filters.q);
  const terms = query.split(/\s+/).filter(Boolean);
  const brand = normalizeText(filters.brand);
  const hasPriceFilter =
    filters.minPrice !== undefined || filters.maxPrice !== undefined;

  return catalog
    .filter((component) => {
      const fields = getSearchFields(component);
      const searchableText = Object.values(fields).join(" ");
      const matchesQuery = terms.every((term) => searchableText.includes(term));
      const matchesCategory =
        !filters.category || component.category === filters.category;
      const matchesBrand = !brand || normalizeText(component.brand) === brand;
      const matchesPrice =
        (!hasPriceFilter || component.price > 0) &&
        (filters.minPrice === undefined || component.price >= filters.minPrice) &&
        (filters.maxPrice === undefined || component.price <= filters.maxPrice);
      const matchesStock =
        filters.stock === "all" ||
        (filters.stock === "in"
          ? component.inStock === true
          : component.inStock === false);

      return (
        matchesQuery &&
        matchesCategory &&
        matchesBrand &&
        matchesPrice &&
        matchesStock
      );
    })
    .sort((a, b) => {
      if (filters.sort === "price-asc") {
        return a.price - b.price || compareNameThenId(a, b);
      }
      if (filters.sort === "price-desc") {
        return b.price - a.price || compareNameThenId(a, b);
      }
      if (filters.sort === "name-asc") return compareNameThenId(a, b);

      return (
        relevanceScore(b, query) - relevanceScore(a, query) ||
        compareNameThenId(a, b)
      );
    });
}

export function getCatalogBrands(catalog: PCComponent[]): string[] {
  const canonicalBrands = new Map<string, string>();

  for (const component of catalog) {
    const brand = component.brand.trim();
    const key = normalizeText(brand);
    if (brand && !canonicalBrands.has(key)) canonicalBrands.set(key, brand);
  }

  return [...canonicalBrands.values()].sort((a, b) =>
    a.localeCompare(b, "es-CL", { sensitivity: "base" }),
  );
}

export function getCatalogSpecBadges(component: PCComponent): string[] {
  if (!component.specs) return [];

  switch (component.category) {
    case "cpu":
      return [
        component.specs.cores ? `${component.specs.cores} Núcleos` : "",
        component.specs.socket ? `Socket ${component.specs.socket}` : "",
        component.specs.tdp ? `${component.specs.tdp}W` : "",
      ].filter(Boolean);
    case "motherboard":
      return [
        component.specs.socket ? `Socket ${component.specs.socket}` : "",
        component.specs.formFactor?.toUpperCase() ?? "",
        component.specs.chipset ?? "",
      ].filter(Boolean);
    case "gpu":
      return [
        component.specs.vram
          ? `${component.specs.vram}GB ${component.specs.memoryType ?? ""}`.trim()
          : "",
        component.specs.length ? `Largo: ${component.specs.length}mm` : "",
        component.specs.recommendedPsuWattage
          ? `PSU Rec: ${component.specs.recommendedPsuWattage}W`
          : "",
      ].filter(Boolean);
    case "ram":
      return [
        component.specs.ramType.toUpperCase(),
        `${component.specs.modules}x${component.specs.capacityPerModule}GB`,
        component.specs.speed ? `${component.specs.speed} MHz` : "",
      ].filter(Boolean);
    case "storage":
      return [
        component.specs.type.toUpperCase(),
        component.specs.capacity >= 1000
          ? `${(component.specs.capacity / 1000).toFixed(1)}TB`
          : `${component.specs.capacity}GB`,
        component.specs.readSpeed ? `${component.specs.readSpeed} MB/s` : "",
      ].filter(Boolean);
    case "psu":
      return [
        `${component.specs.wattage}W`,
        component.specs.formFactor.toUpperCase(),
        component.specs.certification ?? "",
      ].filter(Boolean);
    case "case":
      return [`Max GPU: ${component.specs.maxGpuLength}mm`];
    case "cooler":
      return [component.specs.type === "air" ? "Aire" : "Líquida"];
  }
}
