import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PAYLOAD_PATH = resolve(SCRIPT_DIR, "store-price-comparison-v1.json");
export const APPLY_CONFIRMATION = "stores-price-comparison-v1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRODUCT_IDENTITY_FIELDS = ["sku", "model", "partNumber", "part_number", "mpn"];

function normalizedUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

function isHttpsUrl(value) {
  const url = normalizedUrl(value);
  return url !== null && new URL(url).protocol === "https:";
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function normalizedIdentity(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").toUpperCase() : "";
}

function productIdentityValues(product) {
  if (!product?.specs || typeof product.specs !== "object" || Array.isArray(product.specs)) return [];
  return PRODUCT_IDENTITY_FIELDS
    .map((field) => normalizedIdentity(product.specs[field]))
    .filter(Boolean);
}

export function validatePayload(payload) {
  const errors = [];
  if (payload?.version !== 1) errors.push("version must be 1");
  if (!Array.isArray(payload?.stores) || payload.stores.length === 0) errors.push("stores must be a non-empty array");
  if (!Array.isArray(payload?.listings) || payload.listings.length === 0) errors.push("listings must be a non-empty array");
  if (errors.length > 0) return errors;

  const storeIds = new Set();
  const storeSlugs = new Set();
  const storeUrls = new Set();
  for (const [index, store] of payload.stores.entries()) {
    if (!/^[a-z0-9-]+$/.test(store.id ?? "")) errors.push(`stores[${index}].id is invalid`);
    if (!/^[a-z0-9-]+$/.test(store.slug ?? "")) errors.push(`stores[${index}].slug is invalid`);
    if (typeof store.name !== "string" || store.name.trim().length === 0) errors.push(`stores[${index}].name is invalid`);
    if (!isHttpsUrl(store.websiteUrl)) errors.push(`stores[${index}].websiteUrl must use HTTPS`);
    if (storeIds.has(store.id)) errors.push(`duplicate store id ${store.id}`);
    if (storeSlugs.has(store.slug)) errors.push(`duplicate store slug ${store.slug}`);
    const websiteUrl = normalizedUrl(store.websiteUrl);
    if (websiteUrl && storeUrls.has(websiteUrl)) errors.push(`duplicate store URL ${store.websiteUrl}`);
    storeIds.add(store.id);
    storeSlugs.add(store.slug);
    if (websiteUrl) storeUrls.add(websiteUrl);
  }

  const listingKeys = new Set();
  const listingUrls = new Set();
  for (const [index, listing] of payload.listings.entries()) {
    if (!UUID_PATTERN.test(listing.productId ?? "")) errors.push(`listings[${index}].productId is invalid`);
    if (typeof listing.productSlug !== "string" || listing.productSlug.length === 0) errors.push(`listings[${index}].productSlug is invalid`);
    if (listing.model != null && (typeof listing.model !== "string" || listing.model.trim().length === 0)) {
      errors.push(`listings[${index}].model must be omitted or a non-empty string`);
    }
    if (!storeIds.has(listing.storeId)) errors.push(`listings[${index}].storeId is unknown`);
    if (listing.priceCash !== null && !isPositiveInteger(listing.priceCash)) {
      errors.push(`listings[${index}].priceCash must be null or a positive integer`);
    }
    if (listing.priceNormal !== null && !isPositiveInteger(listing.priceNormal)) {
      errors.push(`listings[${index}].priceNormal must be null or a positive integer`);
    }
    if (!isPositiveInteger(listing.priceCash) && !isPositiveInteger(listing.priceNormal)) {
      errors.push(`listings[${index}] requires priceCash or priceNormal`);
    }
    if (typeof listing.inStock !== "boolean") errors.push(`listings[${index}].inStock must be boolean`);
    if (!isHttpsUrl(listing.productUrl)) errors.push(`listings[${index}].productUrl must use HTTPS`);
    if (typeof listing.verifiedAt !== "string" || Number.isNaN(Date.parse(listing.verifiedAt))) {
      errors.push(`listings[${index}].verifiedAt is invalid`);
    }

    const key = `${listing.productId}:${listing.storeId}`;
    if (listingKeys.has(key)) errors.push(`duplicate product/store pair ${key}`);
    listingKeys.add(key);
    const productUrl = normalizedUrl(listing.productUrl);
    if (productUrl && listingUrls.has(productUrl)) errors.push(`duplicate listing URL ${listing.productUrl}`);
    if (productUrl) listingUrls.add(productUrl);
  }

  return errors;
}

function assertNoError(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data ?? [];
}

function listingKey(row) {
  return `${row.product_id}:${row.store_id}`;
}

function payloadListingKey(listing) {
  return `${listing.productId}:${listing.storeId}`;
}

function listingMatches(row, listing) {
  return row.product_id === listing.productId &&
    row.store_id === listing.storeId &&
    row.price_cash === listing.priceCash &&
    row.price_normal === listing.priceNormal &&
    row.in_stock === listing.inStock &&
    normalizedUrl(row.product_url) === normalizedUrl(listing.productUrl);
}

function groupBy(rows, getKey) {
  const grouped = new Map();
  for (const row of rows) {
    const key = getKey(row);
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }
  return grouped;
}

function conflict(scope, code, key, message) {
  return { scope, code, key, message };
}

export function buildMaintenancePlan({ payload, products, existingStores, existingListings }) {
  const plan = {
    prepared: {
      stores: payload.stores.length,
      listings: payload.listings.length,
      productsCovered: new Set(payload.listings.map((listing) => listing.productId)).size,
    },
    stores: { inserts: [], unchanged: [], conflicts: [] },
    listings: { inserts: [], updates: [], unchanged: [], conflicts: [], outOfStock: [] },
  };
  const productById = new Map(products.map((product) => [product.id, product]));
  const storesById = groupBy(existingStores, (store) => store.id);
  const storesByUrl = groupBy(
    existingStores.filter((store) => normalizedUrl(store.website_url)),
    (store) => normalizedUrl(store.website_url),
  );
  const listingsByKey = groupBy(existingListings, listingKey);
  const listingsByUrl = groupBy(
    existingListings.filter((item) => normalizedUrl(item.product_url)),
    (item) => normalizedUrl(item.product_url),
  );

  for (const store of payload.stores) {
    const matchesById = storesById.get(store.id) ?? [];
    const matchesByUrl = storesByUrl.get(normalizedUrl(store.websiteUrl)) ?? [];
    if (matchesById.length > 1) {
      plan.stores.conflicts.push(conflict("store", "duplicate-id", store.id, `Multiple existing stores use id ${store.id}`));
      continue;
    }
    if (matchesByUrl.some((existing) => existing.id !== store.id)) {
      plan.stores.conflicts.push(conflict("store", "duplicate-url", store.id, `Store URL is already assigned to another store: ${store.websiteUrl}`));
      continue;
    }
    const existing = matchesById[0];
    if (!existing) {
      plan.stores.inserts.push(store);
      continue;
    }
    if (existing.slug !== store.slug || existing.name !== store.name || normalizedUrl(existing.website_url) !== normalizedUrl(store.websiteUrl)) {
      plan.stores.conflicts.push(conflict("store", "metadata-mismatch", store.id, `Existing store metadata conflicts for ${store.id}`));
      continue;
    }
    plan.stores.unchanged.push(store);
  }

  for (const listing of payload.listings) {
    const key = payloadListingKey(listing);
    const product = productById.get(listing.productId);
    if (!product || product.slug !== listing.productSlug || product.is_active !== true) {
      plan.listings.conflicts.push(conflict("listing", "product-identity", key, `Product identity mismatch for ${listing.productSlug}`));
      continue;
    }
    const knownIdentities = productIdentityValues(product);
    if (knownIdentities.length > 0 && !knownIdentities.includes(normalizedIdentity(listing.model))) {
      plan.listings.conflicts.push(conflict("listing", "product-model", key, `Product SKU/model mismatch for ${listing.productSlug}`));
      continue;
    }

    const sameKey = listingsByKey.get(key) ?? [];
    const sameUrl = listingsByUrl.get(normalizedUrl(listing.productUrl)) ?? [];
    if (sameKey.length > 1) {
      plan.listings.conflicts.push(conflict("listing", "duplicate-key", key, `Multiple existing listings use ${key}`));
      continue;
    }
    if (sameUrl.some((row) => listingKey(row) !== key)) {
      plan.listings.conflicts.push(conflict("listing", "duplicate-url", key, `Listing URL is already assigned to another product/store pair: ${listing.productUrl}`));
      continue;
    }

    const existing = sameKey[0];
    if (!existing) {
      plan.listings.inserts.push(listing);
      continue;
    }
    if (normalizedUrl(existing.product_url) !== normalizedUrl(listing.productUrl)) {
      plan.listings.conflicts.push(conflict("listing", "url-mismatch", key, `Existing listing URL conflicts for ${listing.productSlug}/${listing.storeId}`));
      continue;
    }
    if (listingMatches(existing, listing)) {
      plan.listings.unchanged.push(listing);
      continue;
    }

    const changes = {};
    if (existing.price_cash !== listing.priceCash) changes.priceCash = { from: existing.price_cash, to: listing.priceCash };
    if (existing.price_normal !== listing.priceNormal) changes.priceNormal = { from: existing.price_normal, to: listing.priceNormal };
    if (existing.in_stock !== listing.inStock) changes.inStock = { from: existing.in_stock, to: listing.inStock };
    const update = { listing, existing, changes };
    plan.listings.updates.push(update);
    if (existing.in_stock === true && listing.inStock === false) plan.listings.outOfStock.push(update);
  }

  return plan;
}

export function summarizePlan(plan, mode) {
  return {
    mode,
    storesPrepared: plan.prepared.stores,
    storesToInsert: plan.stores.inserts.length,
    listingsPrepared: plan.prepared.listings,
    listingsToInsert: plan.listings.inserts.length,
    listingsToUpdate: plan.listings.updates.length,
    productsCovered: plan.prepared.productsCovered,
    alreadyCurrent: plan.listings.unchanged.length,
    conflicts: plan.stores.conflicts.length + plan.listings.conflicts.length,
    outOfStock: plan.listings.outOfStock.length,
  };
}

async function readCurrentState(supabase, payload) {
  const productIds = [...new Set(payload.listings.map((listing) => listing.productId))];
  const products = assertNoError(
    await supabase.from("products").select("id,slug,name,specs,is_active").in("id", productIds),
    "Product preflight failed",
  );
  const existingStores = assertNoError(
    await supabase.from("stores").select("id,slug,name,website_url"),
    "Store preflight failed",
  );
  const existingListings = assertNoError(
    await supabase.from("store_listings")
      .select("id,product_id,store_id,price_cash,price_normal,in_stock,product_url,last_updated"),
    "Listing preflight failed",
  );

  return { products, existingStores, existingListings };
}

function logConflicts(plan, logger) {
  for (const item of [...plan.stores.conflicts, ...plan.listings.conflicts]) {
    logger(`CONFLICT ${item.code} ${item.key}: ${item.message}`);
  }
}

export async function runMaintenance({ supabase, payload, isApply = false, confirmation = undefined, logger = console.log }) {
  const validationErrors = validatePayload(payload);
  if (validationErrors.length > 0) throw new Error(`Invalid payload:\n- ${validationErrors.join("\n- ")}`);
  if (isApply && confirmation !== APPLY_CONFIRMATION) throw new Error(`Apply requires --confirm=${APPLY_CONFIRMATION}`);

  const state = await readCurrentState(supabase, payload);
  const plan = buildMaintenancePlan({ payload, ...state });
  const summary = summarizePlan(plan, isApply ? "apply" : "dry-run");

  if (!isApply) {
    logger(JSON.stringify(summary, null, 2));
    logConflicts(plan, logger);
    logger(`Dry-run only. Use --apply --confirm=${APPLY_CONFIRMATION} after authentic retailer verification.`);
    return { summary, plan, writesPerformed: false };
  }
  if (summary.conflicts > 0) {
    logConflicts(plan, logger);
    throw new Error("Apply blocked because maintenance conflicts must be resolved first");
  }

  if (plan.stores.inserts.length > 0) {
    assertNoError(
      await supabase.from("stores").insert(plan.stores.inserts.map((store) => ({
        id: store.id,
        slug: store.slug,
        name: store.name,
        website_url: store.websiteUrl,
      }))),
      "Store insert failed",
    );
  }
  if (plan.listings.inserts.length > 0) {
    assertNoError(
      await supabase.from("store_listings").insert(plan.listings.inserts.map((listing) => ({
        product_id: listing.productId,
        store_id: listing.storeId,
        price_cash: listing.priceCash,
        price_normal: listing.priceNormal,
        in_stock: listing.inStock,
        product_url: listing.productUrl,
        last_updated: listing.verifiedAt,
      }))),
      "Listing insert failed",
    );
  }
  for (const { listing } of plan.listings.updates) {
    const updatedRows = assertNoError(
      await supabase.from("store_listings")
        .update({
          price_cash: listing.priceCash,
          price_normal: listing.priceNormal,
          in_stock: listing.inStock,
          last_updated: listing.verifiedAt,
        })
        .eq("product_id", listing.productId)
        .eq("store_id", listing.storeId)
        .select("id"),
      `Listing update failed for ${listing.productSlug}/${listing.storeId}`,
    );
    if (updatedRows.length !== 1) throw new Error(`Listing update count mismatch for ${listing.productSlug}/${listing.storeId}`);
  }

  const postState = await readCurrentState(supabase, payload);
  const postPlan = buildMaintenancePlan({ payload, ...postState });
  const postSummary = summarizePlan(postPlan, "post-apply-dry-run");
  if (
    postSummary.storesToInsert !== 0 ||
    postSummary.listingsToInsert !== 0 ||
    postSummary.listingsToUpdate !== 0 ||
    postSummary.conflicts !== 0 ||
    postSummary.alreadyCurrent !== payload.listings.length ||
    postPlan.stores.unchanged.length !== payload.stores.length
  ) {
    throw new Error("Post-apply read-back is not idempotent");
  }

  const result = {
    ...summary,
    verifiedStores: postPlan.stores.unchanged.length,
    verifiedListings: postSummary.alreadyCurrent,
    idempotent: true,
  };
  logger(JSON.stringify(result, null, 2));
  return { summary: result, plan, postPlan, writesPerformed: true };
}

async function loadPayload() {
  return JSON.parse(await readFile(PAYLOAD_PATH, "utf8"));
}

async function main() {
  const payload = await loadPayload();
  const isApply = process.argv.includes("--apply");
  const confirmation = process.argv.find((argument) => argument.startsWith("--confirm="))?.split("=")[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await runMaintenance({ supabase, payload, isApply, confirmation });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Unknown apply error");
    process.exitCode = 1;
  });
}
