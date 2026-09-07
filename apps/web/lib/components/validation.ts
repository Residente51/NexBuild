import { COMPONENT_CATEGORIES, type ComponentCategory } from "@/lib/categories";
import type { BuildSelection, PCComponent } from "@/types/component";

type UnknownRecord = Record<string, unknown>;

export const PRODUCT_SELECT =
  "id, slug, name, brand, category, specs, image_url, description, is_active, store_listings(price_cash, product_url, in_stock)";
export const LEGACY_PRODUCT_SELECT =
  "id, slug, name, brand, category, specs, image_url, description, store_listings(price_cash, product_url, in_stock)";

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return isString(value) && value.length <= maxLength;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isCategory(value: unknown): value is ComponentCategory {
  return (
    typeof value === "string" &&
    (COMPONENT_CATEGORIES as readonly string[]).includes(value)
  );
}

function optionalString(value: unknown): string | undefined {
  return isBoundedString(value, 2_000) ? value : undefined;
}

function optionalHttpsUrl(value: unknown): string | undefined {
  if (!isBoundedString(value, 2_048)) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function optionalImageSource(value: unknown): string | undefined {
  if (!isBoundedString(value, 2_048)) return undefined;
  if (/^\/images\/[a-z0-9_./()%-]+$/i.test(value)) return value;
  return optionalHttpsUrl(value);
}

/** Parse and validate a domain component at an external-data boundary. */
export function parsePCComponent(value: unknown): PCComponent | null {
  if (!isRecord(value)) return null;

  const { id, slug, name, brand, category, price, specs } = value;
  if (
    !isBoundedString(id, 128) ||
    !isBoundedString(slug, 200) ||
    !isBoundedString(name, 300) ||
    !isBoundedString(brand, 120) ||
    !isCategory(category) ||
    !isFiniteNumber(price) ||
    !Number.isSafeInteger(price) ||
    price < 0 ||
    !isRecord(specs)
  ) {
    return null;
  }

  const base = {
    id,
    slug,
    name,
    brand,
    price,
    image: optionalImageSource(value.image),
    description: optionalString(value.description),
    productUrl: optionalHttpsUrl(value.productUrl),
    priceUpdatedAt: optionalString(value.priceUpdatedAt),
    inStock: isBoolean(value.inStock) ? value.inStock : undefined,
  };

  switch (category) {
    case "cpu":
      if (
        !isString(specs.socket) ||
        !isPositiveNumber(specs.tdp) ||
        !isBoolean(specs.hasIntegratedGraphics) ||
        !isBoolean(specs.includesCooler)
      ) return null;
      return {
        ...base,
        category,
        specs: {
          socket: specs.socket,
          tdp: specs.tdp,
          hasIntegratedGraphics: specs.hasIntegratedGraphics,
          includesCooler: specs.includesCooler,
          cores: isPositiveNumber(specs.cores) ? specs.cores : undefined,
        },
      };

    case "motherboard":
      if (
        !isString(specs.socket) ||
        !isString(specs.formFactor) ||
        (specs.ramType !== "ddr4" && specs.ramType !== "ddr5") ||
        !isPositiveNumber(specs.ramSlots) ||
        !isNonNegativeNumber(specs.m2Slots) ||
        !isNonNegativeNumber(specs.sataPorts)
      ) return null;
      return {
        ...base,
        category,
        specs: {
          socket: specs.socket,
          formFactor: specs.formFactor,
          ramType: specs.ramType,
          ramSlots: specs.ramSlots,
          m2Slots: specs.m2Slots,
          sataPorts: specs.sataPorts,
          chipset: optionalString(specs.chipset),
        },
      };

    case "ram":
      if (
        (specs.ramType !== "ddr4" && specs.ramType !== "ddr5") ||
        !isPositiveNumber(specs.modules) ||
        !isPositiveNumber(specs.capacityPerModule)
      ) return null;
      return {
        ...base,
        category,
        specs: {
          ramType: specs.ramType,
          modules: specs.modules,
          capacityPerModule: specs.capacityPerModule,
          speed: isPositiveNumber(specs.speed) ? specs.speed : undefined,
        },
      };

    case "gpu":
      if (
        !isPositiveNumber(specs.length) ||
        !isPositiveNumber(specs.slotWidth) ||
        !isPositiveNumber(specs.recommendedPsuWattage)
      ) return null;
      return {
        ...base,
        category,
        specs: {
          length: specs.length,
          slotWidth: specs.slotWidth,
          recommendedPsuWattage: specs.recommendedPsuWattage,
          powerDraw: isPositiveNumber(specs.powerDraw) ? specs.powerDraw : undefined,
          tdp: isPositiveNumber(specs.tdp) ? specs.tdp : undefined,
          vram: isPositiveNumber(specs.vram) ? specs.vram : undefined,
          memoryType: optionalString(specs.memoryType),
        },
      };

    case "storage":
      if (
        (specs.type !== "nvme" && specs.type !== "sata") ||
        !["m.2 2280", "2.5", "3.5"].includes(String(specs.formFactor)) ||
        !isPositiveNumber(specs.capacity)
      ) return null;
      return {
        ...base,
        category,
        specs: {
          type: specs.type,
          formFactor: specs.formFactor as "m.2 2280" | "2.5" | "3.5",
          capacity: specs.capacity,
          readSpeed: isPositiveNumber(specs.readSpeed) ? specs.readSpeed : undefined,
        },
      };

    case "psu":
      if (
        !isPositiveNumber(specs.wattage) ||
        !["atx", "sfx", "sfx-l"].includes(String(specs.formFactor))
      ) return null;
      return {
        ...base,
        category,
        specs: {
          wattage: specs.wattage,
          formFactor: specs.formFactor as "atx" | "sfx" | "sfx-l",
          certification: optionalString(specs.certification),
        },
      };

    case "case":
      if (
        !isStringArray(specs.supportedMotherboards) ||
        !isPositiveNumber(specs.maxGpuLength) ||
        !isPositiveNumber(specs.maxCoolerHeight) ||
        !isStringArray(specs.supportedPsuFormFactors) ||
        !isStringArray(specs.radiatorSupport)
      ) return null;
      return {
        ...base,
        category,
        specs: {
          supportedMotherboards: specs.supportedMotherboards,
          maxGpuLength: specs.maxGpuLength,
          maxGpuSlotWidth: isPositiveNumber(specs.maxGpuSlotWidth)
            ? specs.maxGpuSlotWidth
            : undefined,
          maxCoolerHeight: specs.maxCoolerHeight,
          supportedPsuFormFactors: specs.supportedPsuFormFactors,
          radiatorSupport: specs.radiatorSupport,
        },
      };

    case "cooler":
      if (
        (specs.type !== "air" && specs.type !== "aio") ||
        !isStringArray(specs.supportedSockets) ||
        (specs.type === "air" && !isPositiveNumber(specs.height)) ||
        (specs.type === "aio" && !isString(specs.radiatorSize))
      ) return null;
      return {
        ...base,
        category,
        specs: {
          type: specs.type,
          supportedSockets: specs.supportedSockets,
          height: isPositiveNumber(specs.height) ? specs.height : undefined,
          radiatorSize: optionalString(specs.radiatorSize),
        },
      };
  }
}

/** Convert a Supabase product row and choose the cheapest available listing. */
export function parseProductRow(value: unknown): PCComponent | null {
  if (!isRecord(value)) return null;

  const listings = Array.isArray(value.store_listings)
    ? value.store_listings.filter(isRecord)
    : [];
  const pricedListings = listings.filter((listing) =>
    isNonNegativeNumber(listing.price_cash),
  );
  const availableListings = pricedListings.filter(
    (listing) => listing.in_stock === true,
  );
  const listingPool = availableListings.length > 0 ? availableListings : pricedListings;
  const selectedListing = [...listingPool].sort(
    (a, b) => Number(a.price_cash) - Number(b.price_cash),
  )[0];

  return parsePCComponent({
    id: value.id,
    slug: value.slug,
    name: value.name,
    brand: value.brand,
    category: value.category,
    price: selectedListing?.price_cash ?? 0,
    specs: value.specs,
    image: value.image_url,
    description: value.description,
    productUrl: availableListings.length > 0
      ? selectedListing?.product_url
      : undefined,
    priceUpdatedAt: selectedListing?.updated_at,
    inStock: availableListings.length > 0,
  });
}

/** Validate build snapshots loaded from localStorage or shared JSONB. */
export function parseBuildSelection(value: unknown): BuildSelection | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.storage) ||
    value.storage.length > 8
  ) return null;

  const parsedStorage = value.storage.map(parsePCComponent);
  if (
    parsedStorage.some(
      (component) => !component || component.category !== "storage",
    )
  ) return null;

  const build: BuildSelection = {
    storage: parsedStorage as BuildSelection["storage"],
  };

  const slots = [
    "cpu",
    "motherboard",
    "ram",
    "gpu",
    "case",
    "cooler",
    "psu",
  ] as const;

  for (const slot of slots) {
    if (value[slot] == null) continue;
    const component = parsePCComponent(value[slot]);
    if (!component || component.category !== slot) return null;
    Object.assign(build, { [slot]: component });
  }

  return build;
}

/** Refresh a persisted build with the latest catalog records and prices. */
export function reconcileBuildWithCatalog(
  build: BuildSelection,
  catalog: PCComponent[],
): BuildSelection {
  const byId = new Map(catalog.map((component) => [component.id, component]));
  const refreshed: BuildSelection = {
    storage: build.storage.map((component) => {
      const current = byId.get(component.id);
      return current?.category === "storage" ? current : component;
    }),
  };

  const slots = [
    "cpu",
    "motherboard",
    "ram",
    "gpu",
    "case",
    "cooler",
    "psu",
  ] as const;
  for (const slot of slots) {
    const selected = build[slot];
    if (!selected) continue;
    const current = byId.get(selected.id);
    Object.assign(refreshed, {
      [slot]: current?.category === slot ? current : selected,
    });
  }

  return refreshed;
}
