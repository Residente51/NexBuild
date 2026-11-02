import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildMaintenancePlan,
  runMaintenance,
  summarizePlan,
  validatePayload,
} from "./apply-store-price-comparison.mjs";

type Store = { id: string; slug: string; name: string; websiteUrl: string };
type Listing = {
  productId: string;
  productSlug: string;
  model?: string | null;
  storeId: string;
  priceCash: number | null;
  priceNormal: number | null;
  inStock: boolean;
  productUrl: string;
  verifiedAt: string;
};
type Payload = { version: number; stores: Store[]; listings: Listing[] };

const payload = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/store-price-comparison-v1.json"), "utf8"),
) as Payload;

const productId = "89c2f213-78f8-4ced-b3da-32be43d29449";
const store: Store = {
  id: "example-store",
  slug: "example-store",
  name: "Example Store",
  websiteUrl: "https://example.com",
};
const listing: Listing = {
  productId,
  productSlug: "example-product",
  model: "SKU-123",
  storeId: store.id,
  priceCash: 100_000,
  priceNormal: 110_000,
  inStock: true,
  productUrl: "https://example.com/products/sku-123",
  verifiedAt: "2026-11-02T12:00:00-03:00",
};
const basePayload: Payload = { version: 1, stores: [store], listings: [listing] };
const product = { id: productId, slug: listing.productSlug, specs: { sku: "SKU-123" }, is_active: true };
const existingStore = { id: store.id, slug: store.slug, name: store.name, website_url: store.websiteUrl };

function existingListing(overrides: Record<string, unknown> = {}) {
  return {
    id: "listing-1",
    product_id: productId,
    store_id: store.id,
    price_cash: listing.priceCash,
    price_normal: listing.priceNormal,
    in_stock: listing.inStock,
    product_url: listing.productUrl,
    last_updated: listing.verifiedAt,
    ...overrides,
  };
}

function makePlan({
  requestedListing = listing,
  currentListings = [],
}: {
  requestedListing?: Listing;
  currentListings?: Array<ReturnType<typeof existingListing>>;
} = {}) {
  return buildMaintenancePlan({
    payload: { ...basePayload, listings: [requestedListing] },
    products: [product],
    existingStores: [existingStore],
    existingListings: currentListings,
  });
}

class FakeQuery {
  private filters: Array<{ column: string; values: unknown[] }> = [];

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Array<Record<string, unknown>>>,
    private readonly recordWrite: () => void,
  ) {}

  select() {
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, values });
    return this;
  }

  insert() {
    this.recordWrite();
    throw new Error("dry-run attempted an insert");
  }

  update() {
    this.recordWrite();
    throw new Error("dry-run attempted an update");
  }

  then(resolvePromise: (value: { data: Array<Record<string, unknown>>; error: null }) => void) {
    const rows = (this.rowsByTable[this.table] ?? []).filter((row) =>
      this.filters.every(({ column, values }) => values.includes(row[column])),
    );
    resolvePromise({ data: rows, error: null });
  }
}

function createReadOnlySupabase(rowsByTable: Record<string, Array<Record<string, unknown>>>) {
  let writes = 0;
  return {
    client: {
      from(table: string) {
        return new FakeQuery(table, rowsByTable, () => {
          writes += 1;
        });
      },
    },
    getWrites: () => writes,
  };
}

describe("Stores & Price Comparison 1.0 payload", () => {
  it("mantiene el payload existente válido y con claves únicas", () => {
    expect(validatePayload(payload)).toEqual([]);
  });

  it("admite contado nulo solo cuando existe precio normal positivo", () => {
    const normalOnly = { ...listing, priceCash: null, priceNormal: 110_000 };
    expect(validatePayload({ ...basePayload, listings: [normalOnly] })).toEqual([]);

    const noPrice = { ...normalOnly, priceNormal: null };
    expect(validatePayload({ ...basePayload, listings: [noPrice] })).toContain(
      "listings[0] requires priceCash or priceNormal",
    );
  });

  it("rechaza URLs de oferta duplicadas", () => {
    const duplicate = {
      ...listing,
      productId: "c68a1ef4-5e1f-4e76-995b-e01aed950d48",
      productSlug: "another-product",
    };
    expect(validatePayload({ ...basePayload, listings: [listing, duplicate] })).toContain(
      `duplicate listing URL ${listing.productUrl}`,
    );
  });
});

describe("store listing maintenance plan", () => {
  it("clasifica un par producto/tienda nuevo como insert", () => {
    const summary = summarizePlan(makePlan(), "dry-run");
    expect(summary).toMatchObject({ listingsToInsert: 1, listingsToUpdate: 0, alreadyCurrent: 0, conflicts: 0 });
  });

  it("clasifica cambios de precio como update", () => {
    const plan = makePlan({ currentListings: [existingListing({ price_cash: 95_000 })] });
    expect(plan.listings.updates).toHaveLength(1);
    const updates = plan.listings.updates as Array<{ changes: Record<string, unknown> }>;
    expect(updates[0].changes).toEqual({ priceCash: { from: 95_000, to: 100_000 } });
  });

  it("clasifica una oferta idéntica como unchanged", () => {
    const summary = summarizePlan(makePlan({ currentListings: [existingListing()] }), "dry-run");
    expect(summary).toMatchObject({ listingsToInsert: 0, listingsToUpdate: 0, alreadyCurrent: 1, conflicts: 0 });
  });

  it("detecta conflicto cuando el mismo par intenta cambiar de URL", () => {
    const plan = makePlan({ currentListings: [existingListing({ product_url: "https://example.com/products/other" })] });
    expect(plan.listings.conflicts).toEqual([
      expect.objectContaining({ code: "url-mismatch", key: `${productId}:${store.id}` }),
    ]);
  });

  it("detecta una baja de stock sin perder su clasificación como update", () => {
    const requestedListing = { ...listing, inStock: false };
    const plan = makePlan({ requestedListing, currentListings: [existingListing()] });
    expect(plan.listings.updates).toHaveLength(1);
    expect(plan.listings.outOfStock).toHaveLength(1);
    expect(summarizePlan(plan, "dry-run")).toMatchObject({ listingsToUpdate: 1, outOfStock: 1 });
  });

  it("rechaza un SKU/modelo que contradice la identidad disponible", () => {
    const requestedListing = { ...listing, model: "OTHER-SKU" };
    const plan = makePlan({ requestedListing });
    expect(plan.listings.conflicts).toEqual([expect.objectContaining({ code: "product-model" })]);
  });
});

describe("store listing maintenance runner", () => {
  it("no ejecuta escrituras en dry-run", async () => {
    const fake = createReadOnlySupabase({
      products: [product],
      stores: [existingStore],
      store_listings: [existingListing()],
    });
    const messages: string[] = [];

    const result = await runMaintenance({
      supabase: fake.client,
      payload: basePayload,
      logger: (message: string) => messages.push(message),
    });

    expect(result.summary).toMatchObject({ mode: "dry-run", alreadyCurrent: 1 });
    expect(result.writesPerformed).toBe(false);
    expect(fake.getWrites()).toBe(0);
    expect(messages.at(-1)).toContain("Dry-run only");
  });
});
