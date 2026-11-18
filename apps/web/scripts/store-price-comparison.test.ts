import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPLY_CONFIRMATION,
  APPLY_CONFIRMATION_V2,
  PartialApplyError,
  buildMaintenancePlan,
  parseCliOptions,
  parseIsoTimestamp,
  resolvePayloadPath,
  runMaintenance,
  summarizePlan,
  validatePayload,
} from "./apply-store-price-comparison.mjs";

type Store = {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  slugMigration?: { from: null };
};
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
  verifiedIdentity?: { productId: string; storeId: string; model: string };
  urlMigration?: { from: string };
};
type Payload = { version: number; stores: Store[]; listings: Listing[] };

const payload = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/store-price-comparison-v1.json"), "utf8"),
) as Payload;

const b2Payload = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/store-price-comparison-b2.json"), "utf8"),
) as Payload;

const phaseA12Payload = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/store-price-comparison-1-2.json"), "utf8"),
) as Payload;

const productId = "89c2f213-78f8-4ced-b3da-32be43d29449";
const secondProductId = "c68a1ef4-5e1f-4e76-995b-e01aed950d48";
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
const legacyStore: Store = { ...store, slugMigration: { from: null } };
const urlMigrationListing: Listing = {
  ...listing,
  productUrl: "https://example.com/products/sku-123-current",
  verifiedIdentity: { productId, storeId: store.id, model: "SKU-123" },
  urlMigration: { from: listing.productUrl },
};
const version2Payload: Payload = {
  version: 2,
  stores: [legacyStore],
  listings: [urlMigrationListing],
};

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

  it("permite mostrar contado nulo en dry-run solo con precio normal positivo", () => {
    const normalOnly = { ...listing, priceCash: null, priceNormal: 110_000 };
    expect(validatePayload({ ...basePayload, listings: [normalOnly] })).toEqual([]);

    const noPrice = { ...normalOnly, priceNormal: null };
    expect(validatePayload({ ...basePayload, listings: [noPrice] })).toContain(
      "listings[0] requires priceCash or priceNormal",
    );
  });

  it("preserva orden temporal con 0, 3 y 6 decimales y zonas equivalentes", () => {
    const wholeSecond = parseIsoTimestamp("2026-11-02T15:00:00Z");
    const milliseconds = parseIsoTimestamp("2026-11-02T15:00:00.123Z");
    const microseconds = parseIsoTimestamp("2026-11-02T12:00:00.123456-03:00");

    expect(wholeSecond).toBe(parseIsoTimestamp("2026-11-02T12:00:00-03:00"));
    expect(milliseconds).toBe(parseIsoTimestamp("2026-11-02T15:00:00.123000+00:00"));
    expect(microseconds).toBe((milliseconds as bigint) + BigInt(456));
  });

  it("exige un timestamp ISO real con zona y rechaza fechas u offsets inválidos", () => {
    expect(parseIsoTimestamp("2026-02-30T12:00:00-03:00")).toBeNull();
    expect(parseIsoTimestamp("2026-11-02T12:00:00")).toBeNull();
    expect(parseIsoTimestamp("2026-11-02T12:00:00.1234567Z")).toBeNull();
    expect(parseIsoTimestamp("2026-11-02T12:00:00+14:01")).toBeNull();

    const invalidDate = { ...listing, verifiedAt: "2026-02-30T12:00:00-03:00" };
    expect(validatePayload({ ...basePayload, listings: [invalidDate] }, { now: Date.parse("2026-11-02T15:00:00Z") })).toContain(
      "listings[0].verifiedAt must be a real ISO timestamp with timezone",
    );

    const future = { ...listing, verifiedAt: "2026-11-03T12:00:00-03:00" };
    expect(validatePayload({ ...basePayload, listings: [future] }, { now: Date.parse("2026-11-02T15:00:00Z") })).toContain(
      "listings[0].verifiedAt is too far in the future",
    );
  });

  it("restringe la selección de lotes a nombres JSON controlados dentro de scripts", () => {
    expect(parseCliOptions(["--payload=store-price-comparison-b2.json"])).toMatchObject({
      payloadFilename: "store-price-comparison-b2.json",
      isApply: false,
    });
    expect(resolvePayloadPath("store-price-comparison-b2.json")).toMatch(/scripts[\\/]store-price-comparison-b2\.json$/);
    expect(() => parseCliOptions(["--payload=../secret.json"])).toThrow("Payload must be");
    expect(() => parseCliOptions(["--payload=batch.json"])).toThrow("Payload must be");
    expect(() => parseCliOptions(["--payload=store-price-comparison-b2.json", "--payload=store-price-comparison-b3.json"]))
      .toThrow("Unknown or duplicate argument");
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

describe("Store Coverage 1.1 B2 payload", () => {
  it("mantiene el lote válido, trazable y sin precios contado nulos", () => {
    expect(validatePayload(b2Payload)).toEqual([]);
    expect(b2Payload.listings.map(({ productSlug, storeId }) => `${productSlug}:${storeId}`)).toEqual([
      "sapphire-pulse-amd-radeon-rx-7600:alltec",
      "intel-core-i9-14900k:centrale",
    ]);
    expect(b2Payload.listings.every(({ priceCash }) => Number.isSafeInteger(priceCash) && (priceCash ?? 0) > 0)).toBe(true);
  });
});

describe("Store Coverage 1.2 Phase A payload", () => {
  it("mantiene separados y explícitos los dos candidatos SP Digital revalidados", () => {
    expect(validatePayload(phaseA12Payload)).toEqual([]);
    expect(phaseA12Payload.version).toBe(2);
    expect(phaseA12Payload.stores).toEqual([
      expect.objectContaining({ id: "spdigital", slug: "spdigital", slugMigration: { from: null } }),
    ]);
    expect(phaseA12Payload.listings.map(({ productSlug, storeId }) => `${productSlug}:${storeId}`)).toEqual([
      "kingston-nv2-1tb:spdigital",
      "amd-ryzen-7-5800x3d:spdigital",
    ]);
    expect(phaseA12Payload.listings.every(({ verifiedIdentity, productId, storeId, model }) =>
      verifiedIdentity?.productId === productId &&
      verifiedIdentity.storeId === storeId &&
      verifiedIdentity.model === model
    )).toBe(true);
  });

  it("rechaza autorizaciones ambiguas de metadata o identidad", () => {
    const wrongIdentity = {
      ...urlMigrationListing,
      verifiedIdentity: { ...urlMigrationListing.verifiedIdentity, model: "SKU123" },
    };
    expect(validatePayload({ ...version2Payload, listings: [wrongIdentity] })).toContain(
      "listings[0].verifiedIdentity must exactly repeat productId, storeId, and model",
    );
    expect(validatePayload({
      ...version2Payload,
      stores: [{ ...legacyStore, slugMigration: { from: "other-store" } }],
    })).toContain("stores[0].slugMigration must explicitly contain only from:null");
  });
});

describe("store listing maintenance plan", () => {
  it("clasifica un par producto/tienda nuevo como insert", () => {
    const summary = summarizePlan(makePlan(), "dry-run");
    expect(summary).toMatchObject({ listingsToInsert: 1, listingsToUpdate: 0, alreadyCurrent: 0, conflicts: 0 });
  });

  it("clasifica cambios de precio como update", () => {
    const plan = makePlan({
      currentListings: [existingListing({ price_cash: 95_000, last_updated: "2026-11-01T12:00:00-03:00" })],
    });
    expect(plan.listings.updates).toHaveLength(1);
    const updates = plan.listings.updates as Array<{ changes: Record<string, unknown> }>;
    expect(updates[0].changes).toEqual({ priceCash: { from: 95_000, to: 100_000 } });
  });

  it("clasifica una oferta idéntica como unchanged", () => {
    const summary = summarizePlan(makePlan({ currentListings: [existingListing()] }), "dry-run");
    expect(summary).toMatchObject({ listingsToInsert: 0, listingsToUpdate: 0, alreadyCurrent: 1, conflicts: 0 });
  });

  it("bloquea un payload anterior aunque sus datos comerciales coincidan", () => {
    const plan = makePlan({
      requestedListing: { ...listing, verifiedAt: "2026-11-01T12:00:00-03:00" },
      currentListings: [existingListing()],
    });
    expect(plan.listings.blocked).toEqual([expect.objectContaining({ code: "stale-verified-at" })]);
    expect(summarizePlan(plan, "dry-run")).toMatchObject({ blocked: 1, alreadyCurrent: 0 });
  });

  it("trata misma fecha y mismos datos como reintento, pero bloquea datos distintos", () => {
    const retry = makePlan({ currentListings: [existingListing()] });
    expect(retry.listings.unchanged).toHaveLength(1);

    const collision = makePlan({ currentListings: [existingListing({ price_cash: 90_000 })] });
    expect(collision.listings.blocked).toEqual([expect.objectContaining({ code: "timestamp-collision" })]);
    expect(collision.listings.updates).toHaveLength(0);
  });

  it("ordena microsegundos antes, igual y después sin depender de la representación de zona", () => {
    const existing = existingListing({ last_updated: "2026-11-02T15:00:00.123456+00:00" });

    const stale = makePlan({
      requestedListing: { ...listing, verifiedAt: "2026-11-02T15:00:00.123455Z" },
      currentListings: [existing],
    });
    expect(stale.listings.blocked).toEqual([expect.objectContaining({ code: "stale-verified-at" })]);

    const retry = makePlan({
      requestedListing: { ...listing, verifiedAt: "2026-11-02T12:00:00.123456-03:00" },
      currentListings: [existing],
    });
    expect(retry.listings.unchanged).toHaveLength(1);

    const refresh = makePlan({
      requestedListing: { ...listing, verifiedAt: "2026-11-02T15:00:00.123457Z" },
      currentListings: [existing],
    });
    expect(refresh.listings.refreshes).toHaveLength(1);
  });

  it("clasifica una revalidación más reciente sin cambios como refresh", () => {
    const plan = makePlan({ currentListings: [existingListing({ last_updated: "2026-11-01T12:00:00-03:00" })] });
    expect(plan.listings.refreshes).toHaveLength(1);
    expect(plan.listings.unchanged).toHaveLength(0);
    expect(summarizePlan(plan, "dry-run")).toMatchObject({ listingsToRefresh: 1, listingsToUpdate: 0 });
  });

  it("detecta conflicto cuando el mismo par intenta cambiar de URL", () => {
    const plan = makePlan({ currentListings: [existingListing({ product_url: "https://example.com/products/other" })] });
    expect(plan.listings.conflicts).toEqual([
      expect.objectContaining({ code: "url-mismatch", key: `${productId}:${store.id}` }),
    ]);
  });

  it("detecta una baja de stock sin perder su clasificación como update", () => {
    const requestedListing = { ...listing, inStock: false };
    const plan = makePlan({
      requestedListing,
      currentListings: [existingListing({ last_updated: "2026-11-01T12:00:00-03:00" })],
    });
    expect(plan.listings.updates).toHaveLength(1);
    expect(plan.listings.outOfStock).toHaveLength(1);
    expect(summarizePlan(plan, "dry-run")).toMatchObject({ listingsToUpdate: 1, outOfStock: 1 });
  });

  it("rechaza un SKU/modelo que contradice la identidad disponible", () => {
    const requestedListing = { ...listing, model: "OTHER-SKU" };
    const plan = makePlan({ requestedListing });
    expect(plan.listings.conflicts).toEqual([expect.objectContaining({ code: "product-model" })]);
  });

  it("no inventa equivalencia entre identidades con puntuación o espacios distintos", () => {
    const requestedListing = { ...listing, model: "SKU123" };
    const plan = buildMaintenancePlan({
      payload: { ...basePayload, listings: [requestedListing] },
      products: [{ ...product, specs: { sku: "SKU 123" } }],
      existingStores: [existingStore],
      existingListings: [],
    });
    expect(plan.listings.conflicts).toEqual([expect.objectContaining({ code: "product-model" })]);
  });

  it("autoriza solo el slug legacy nulo declarado explícitamente", () => {
    const plan = buildMaintenancePlan({
      payload: version2Payload,
      products: [product],
      existingStores: [{ ...existingStore, slug: null }],
      existingListings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-01T12:00:00-03:00",
      })],
    });

    expect(plan.stores.metadataUpdates).toEqual([
      expect.objectContaining({ changes: { slug: { from: null, to: store.slug } } }),
    ]);
    expect(plan.stores.conflicts).toHaveLength(0);
  });

  it("mantiene metadata-mismatch para cambios de tienda no aprobados", () => {
    const plan = buildMaintenancePlan({
      payload: version2Payload,
      products: [product],
      existingStores: [{ ...existingStore, slug: null, name: "Renamed Store" }],
      existingListings: [],
    });

    expect(plan.stores.metadataUpdates).toHaveLength(0);
    expect(plan.stores.conflicts).toEqual([expect.objectContaining({ code: "metadata-mismatch" })]);
  });

  it("rechaza reasignar un slug que ya pertenece a otra tienda", () => {
    const plan = buildMaintenancePlan({
      payload: version2Payload,
      products: [product],
      existingStores: [
        { ...existingStore, slug: null },
        { id: "other-store", slug: store.slug, name: "Other Store", website_url: "https://other.example.com" },
      ],
      existingListings: [],
    });

    expect(plan.stores.metadataUpdates).toHaveLength(0);
    expect(plan.stores.conflicts).toEqual([expect.objectContaining({ code: "duplicate-slug" })]);
  });

  it("clasifica una migración de URL legítima como cambio trazable", () => {
    const plan = buildMaintenancePlan({
      payload: version2Payload,
      products: [product],
      existingStores: [{ ...existingStore, slug: null }],
      existingListings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-01T12:00:00-03:00",
      })],
    });

    expect(plan.listings.updates).toEqual([
      expect.objectContaining({
        changes: expect.objectContaining({
          productUrl: { from: listing.productUrl, to: urlMigrationListing.productUrl },
        }),
      }),
    ]);
    expect(summarizePlan(plan, "dry-run")).toMatchObject({
      storesToUpdate: 1,
      listingsToUpdate: 1,
      listingUrlsToMigrate: 1,
      conflicts: 0,
    });
  });

  it("rechaza conflictos y reasignaciones de URL", () => {
    const targetCollision = buildMaintenancePlan({
      payload: version2Payload,
      products: [product],
      existingStores: [existingStore],
      existingListings: [
        existingListing({ product_url: listing.productUrl }),
        existingListing({
          id: "listing-2",
          product_id: secondProductId,
          product_url: urlMigrationListing.productUrl,
        }),
      ],
    });
    expect(targetCollision.listings.conflicts).toEqual([
      expect.objectContaining({ code: "duplicate-url" }),
    ]);

    const reassignment = buildMaintenancePlan({
      payload: version2Payload,
      products: [product],
      existingStores: [existingStore],
      existingListings: [existingListing({
        product_id: secondProductId,
        product_url: listing.productUrl,
      })],
    });
    expect(reassignment.listings.conflicts).toEqual([
      expect.objectContaining({ code: "url-migration-source-reassigned" }),
    ]);
  });

  it("bloquea una migración de URL con timestamp obsoleto", () => {
    const plan = buildMaintenancePlan({
      payload: version2Payload,
      products: [product],
      existingStores: [existingStore],
      existingListings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-03T12:00:00-03:00",
      })],
    });
    expect(plan.listings.blocked).toEqual([expect.objectContaining({ code: "stale-verified-at" })]);
    expect(plan.listings.updates).toHaveLength(0);
  });
});

class MutableQuery {
  private filters: Array<{ column: string; values: unknown[] }> = [];
  private operation: "read" | "insert" | "update" = "read";
  private values: Array<Record<string, unknown>> | Record<string, unknown> | undefined;

  constructor(
    private readonly table: string,
    private readonly rowsByTable: Record<string, Array<Record<string, unknown>>>,
    private readonly state: {
      writeAttempts: number;
      failOnWriteAttempt: number | null;
      beforeWriteAttempt: ((table: string, attempt: number) => void) | null;
    },
  ) {}

  select() {
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, values });
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, values: [value] });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, values: [value] });
    return this;
  }

  insert(values: Array<Record<string, unknown>>) {
    this.operation = "insert";
    this.values = values;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.operation = "update";
    this.values = values;
    return this;
  }

  then(resolvePromise: (value: { data: Array<Record<string, unknown>>; error: { message: string } | null }) => void) {
    const rows = this.rowsByTable[this.table] ?? [];
    const matches = (row: Record<string, unknown>) =>
      this.filters.every(({ column, values }) => values.includes(row[column]));

    if (this.operation === "read") {
      resolvePromise({ data: rows.filter(matches), error: null });
      return;
    }

    this.state.writeAttempts += 1;
    this.state.beforeWriteAttempt?.(this.table, this.state.writeAttempts);
    if (this.state.failOnWriteAttempt === this.state.writeAttempts) {
      this.state.failOnWriteAttempt = null;
      resolvePromise({ data: [], error: { message: "simulated mid-apply failure" } });
      return;
    }

    if (this.operation === "insert") {
      const inserted = (this.values as Array<Record<string, unknown>>).map((row, index) => ({
        id: row.id ?? `${this.table}-${rows.length + index + 1}`,
        ...row,
      }));
      rows.push(...inserted);
      resolvePromise({ data: inserted, error: null });
      return;
    }

    const updated = rows.filter(matches);
    for (const row of updated) Object.assign(row, this.values);
    resolvePromise({ data: updated.map((row) => ({ id: row.id })), error: null });
  }
}

function createMutableSupabase(
  rowsByTable: Record<string, Array<Record<string, unknown>>>,
  failOnWriteAttempt: number | null = null,
  beforeWriteAttempt: ((table: string, attempt: number) => void) | null = null,
) {
  const state = { writeAttempts: 0, failOnWriteAttempt, beforeWriteAttempt };
  return {
    client: {
      from(table: string) {
        return new MutableQuery(table, rowsByTable, state);
      },
    },
    rowsByTable,
    state,
  };
}

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

  it("bloquea priceCash:null antes de cualquier escritura", async () => {
    const normalOnly = { ...listing, priceCash: null, priceNormal: 110_000 };
    const fake = createReadOnlySupabase({ products: [product], stores: [existingStore], store_listings: [] });

    await expect(runMaintenance({
      supabase: fake.client,
      payload: { ...basePayload, listings: [normalOnly] },
      isApply: true,
      confirmation: APPLY_CONFIRMATION,
      logger: () => undefined,
    })).rejects.toThrow("before any write");
    expect(fake.getWrites()).toBe(0);
  });

  it("aplica solo last_updated para una revalidación auténticamente más reciente", async () => {
    const rows = {
      products: [{ ...product }],
      stores: [{ ...existingStore }],
      store_listings: [existingListing({ last_updated: "2026-11-01T12:00:00-03:00" })],
    };
    const fake = createMutableSupabase(rows);

    const result = await runMaintenance({
      supabase: fake.client,
      payload: basePayload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION,
      logger: () => undefined,
    });

    expect(result.summary).toMatchObject({ listingsToRefresh: 1, idempotent: true });
    expect(fake.state.writeAttempts).toBe(1);
    expect(rows.store_listings[0]).toMatchObject({
      price_cash: listing.priceCash,
      last_updated: listing.verifiedAt,
    });
  });

  it("usa la representación exacta leída de Supabase en el update optimista", async () => {
    const rows = {
      products: [{ ...product }],
      stores: [{ ...existingStore }],
      store_listings: [existingListing({ last_updated: "2026-11-02T15:00:00.123456+00:00" })],
    };
    const fake = createMutableSupabase(rows);
    const verifiedAt = "2026-11-02T15:00:00.123457Z";

    const result = await runMaintenance({
      supabase: fake.client,
      payload: { ...basePayload, listings: [{ ...listing, verifiedAt }] },
      isApply: true,
      confirmation: APPLY_CONFIRMATION,
      logger: () => undefined,
    });

    expect(result.summary).toMatchObject({ listingsToRefresh: 1, idempotent: true });
    expect(rows.store_listings[0].last_updated).toBe(verifiedAt);
  });

  it("reporta fallo parcial y permite recuperar con un reintento idempotente", async () => {
    const secondListing: Listing = {
      ...listing,
      productId: secondProductId,
      productSlug: "second-product",
      model: "SKU-456",
      productUrl: "https://example.com/products/sku-456",
    };
    const twoListingPayload: Payload = { ...basePayload, listings: [listing, secondListing] };
    const rows = {
      products: [
        { ...product },
        { id: secondProductId, slug: secondListing.productSlug, specs: { sku: secondListing.model }, is_active: true },
      ],
      stores: [{ ...existingStore }],
      store_listings: [
        existingListing({ price_cash: 90_000, last_updated: "2026-11-01T12:00:00-03:00" }),
        existingListing({
          id: "listing-2",
          product_id: secondProductId,
          price_cash: 90_000,
          product_url: secondListing.productUrl,
          last_updated: "2026-11-01T12:00:00-03:00",
        }),
      ],
    };
    const fake = createMutableSupabase(rows, 2);

    let failure: unknown;
    try {
      await runMaintenance({
        supabase: fake.client,
        payload: twoListingPayload,
        isApply: true,
        confirmation: APPLY_CONFIRMATION,
        logger: () => undefined,
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(PartialApplyError);
    expect((failure as PartialApplyError).execution).toMatchObject({
      status: "partial-or-unknown",
      listingsUpdated: 1,
    });
    expect(rows.store_listings[0]).toMatchObject({ price_cash: listing.priceCash, last_updated: listing.verifiedAt });
    expect(rows.store_listings[1]).toMatchObject({ price_cash: 90_000, last_updated: "2026-11-01T12:00:00-03:00" });

    const recovered = await runMaintenance({
      supabase: fake.client,
      payload: twoListingPayload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION,
      logger: () => undefined,
    });
    expect(recovered.summary).toMatchObject({ alreadyCurrent: 1, listingsToUpdate: 1, idempotent: true });
    expect(rows.store_listings[1]).toMatchObject({ price_cash: secondListing.priceCash, last_updated: secondListing.verifiedAt });
  });

  it("mantiene el dry-run v1.2 completamente libre de escrituras", async () => {
    const fake = createReadOnlySupabase({
      products: [product],
      stores: [{ ...existingStore, slug: null }],
      store_listings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-01T12:00:00-03:00",
      })],
    });

    const result = await runMaintenance({
      supabase: fake.client,
      payload: version2Payload,
      logger: () => undefined,
    });

    expect(result.summary).toMatchObject({
      mode: "dry-run",
      storesToUpdate: 1,
      listingUrlsToMigrate: 1,
      conflicts: 0,
      blocked: 0,
    });
    expect(result.writesPerformed).toBe(false);
    expect(fake.getWrites()).toBe(0);
  });

  it("exige una confirmación distinta y explícita para payloads v2", async () => {
    const fake = createReadOnlySupabase({
      products: [product],
      stores: [{ ...existingStore, slug: null }],
      store_listings: [],
    });

    await expect(runMaintenance({
      supabase: fake.client,
      payload: version2Payload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION,
      logger: () => undefined,
    })).rejects.toThrow(`--confirm=${APPLY_CONFIRMATION_V2}`);
    expect(fake.getWrites()).toBe(0);
  });

  it("aplica metadata legacy y URL con read-back idempotente", async () => {
    const rows = {
      products: [{ ...product }],
      stores: [{ ...existingStore, slug: null }],
      store_listings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-01T12:00:00-03:00",
      })],
    };
    const fake = createMutableSupabase(rows);

    const result = await runMaintenance({
      supabase: fake.client,
      payload: version2Payload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION_V2,
      logger: () => undefined,
    });

    expect(result.summary).toMatchObject({
      storesToUpdate: 1,
      listingUrlsToMigrate: 1,
      idempotent: true,
      execution: expect.objectContaining({ storesUpdated: 1, listingsUpdated: 1 }),
    });
    expect(rows.stores[0].slug).toBe(store.slug);
    expect(rows.store_listings[0]).toMatchObject({
      product_id: productId,
      store_id: store.id,
      product_url: urlMigrationListing.productUrl,
      last_updated: urlMigrationListing.verifiedAt,
    });
  });

  it("detecta un cambio concurrente antes de sobrescribir la oferta", async () => {
    const rows = {
      products: [{ ...product }],
      stores: [{ ...existingStore }],
      store_listings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-01T12:00:00-03:00",
      })],
    };
    const fake = createMutableSupabase(rows, null, (table, attempt) => {
      if (table === "store_listings" && attempt === 1) rows.store_listings[0].price_cash = 99_000;
    });

    await expect(runMaintenance({
      supabase: fake.client,
      payload: version2Payload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION_V2,
      logger: () => undefined,
    })).rejects.toBeInstanceOf(PartialApplyError);

    expect(rows.store_listings[0]).toMatchObject({
      price_cash: 99_000,
      product_url: listing.productUrl,
      last_updated: "2026-11-01T12:00:00-03:00",
    });
  });

  it("detecta un cambio concurrente de metadata antes de completar el slug", async () => {
    const rows = {
      products: [{ ...product }],
      stores: [{ ...existingStore, slug: null }],
      store_listings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-01T12:00:00-03:00",
      })],
    };
    const fake = createMutableSupabase(rows, null, (table, attempt) => {
      if (table === "stores" && attempt === 1) rows.stores[0].name = "Concurrent Rename";
    });

    await expect(runMaintenance({
      supabase: fake.client,
      payload: version2Payload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION_V2,
      logger: () => undefined,
    })).rejects.toBeInstanceOf(PartialApplyError);

    expect(rows.stores[0]).toMatchObject({ slug: null, name: "Concurrent Rename" });
    expect(rows.store_listings[0].product_url).toBe(listing.productUrl);
  });

  it("recupera una falla parcial entre slug y URL al reintentar el mismo payload", async () => {
    const rows = {
      products: [{ ...product }],
      stores: [{ ...existingStore, slug: null }],
      store_listings: [existingListing({
        product_url: listing.productUrl,
        last_updated: "2026-11-01T12:00:00-03:00",
      })],
    };
    const fake = createMutableSupabase(rows, 2);

    await expect(runMaintenance({
      supabase: fake.client,
      payload: version2Payload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION_V2,
      logger: () => undefined,
    })).rejects.toBeInstanceOf(PartialApplyError);
    expect(rows.stores[0].slug).toBe(store.slug);
    expect(rows.store_listings[0].product_url).toBe(listing.productUrl);

    const recovered = await runMaintenance({
      supabase: fake.client,
      payload: version2Payload,
      isApply: true,
      confirmation: APPLY_CONFIRMATION_V2,
      logger: () => undefined,
    });
    expect(recovered.summary).toMatchObject({
      storesToUpdate: 0,
      listingUrlsToMigrate: 1,
      idempotent: true,
    });
    expect(rows.store_listings[0].product_url).toBe(urlMigrationListing.productUrl);
  });
});
