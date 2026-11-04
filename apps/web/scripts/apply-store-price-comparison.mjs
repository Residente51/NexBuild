import { readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PAYLOAD_FILENAME = "store-price-comparison-v1.json";
export const APPLY_CONFIRMATION = "stores-price-comparison-v1";
export const APPLY_CONFIRMATION_V2 = "stores-price-comparison-1-2";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAYLOAD_FILENAME_PATTERN = /^store-price-comparison-[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.json$/;
const ISO_TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|([+-])(\d{2}):(\d{2}))$/;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MICROSECONDS_PER_MILLISECOND = 1000n;
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
  if (url === null) return false;
  const parsed = new URL(url);
  return parsed.protocol === "https:" && parsed.username === "" && parsed.password === "";
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function normalizedIdentity(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function parseIsoTimestamp(value) {
  if (typeof value !== "string") return null;
  const match = ISO_TIMESTAMP_PATTERN.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fractionText = "", zone, offsetSign, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = zone === "Z" ? 0 : Number(offsetHourText);
  const offsetMinute = zone === "Z" ? 0 : Number(offsetMinuteText);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (
    year < 1 || month < 1 || month > 12 ||
    day < 1 || day > daysInMonth ||
    hour > 23 || minute > 59 || second > 59 ||
    offsetHour > 14 || offsetMinute > 59 || (offsetHour === 14 && offsetMinute !== 0)
  ) return null;

  const localTime = new Date(0);
  localTime.setUTCFullYear(year, month - 1, day);
  localTime.setUTCHours(hour, minute, second, 0);
  const offsetMinutes = zone === "Z"
    ? 0
    : (offsetSign === "-" ? -1 : 1) * (offsetHour * 60 + offsetMinute);
  const epochMilliseconds = localTime.getTime() - offsetMinutes * 60 * 1000;
  const fractionMicroseconds = BigInt(fractionText.padEnd(6, "0") || "0");
  return BigInt(epochMilliseconds) * MICROSECONDS_PER_MILLISECOND + fractionMicroseconds;
}

export function resolvePayloadPath(filename = DEFAULT_PAYLOAD_FILENAME) {
  if (
    typeof filename !== "string" ||
    basename(filename) !== filename ||
    !PAYLOAD_FILENAME_PATTERN.test(filename)
  ) {
    throw new Error("Payload must be a store-price-comparison-*.json file inside apps/web/scripts");
  }
  return resolve(SCRIPT_DIR, filename);
}

export function parseCliOptions(argv) {
  let isApply = false;
  let confirmation;
  let payloadFilename = DEFAULT_PAYLOAD_FILENAME;
  let payloadSpecified = false;

  for (const argument of argv) {
    if (argument === "--apply" && !isApply) {
      isApply = true;
    } else if (argument.startsWith("--confirm=") && confirmation === undefined) {
      confirmation = argument.slice("--confirm=".length);
    } else if (argument.startsWith("--payload=") && !payloadSpecified) {
      payloadFilename = argument.slice("--payload=".length);
      payloadSpecified = true;
    } else {
      throw new Error(`Unknown or duplicate argument: ${argument}`);
    }
  }

  resolvePayloadPath(payloadFilename);
  return { isApply, confirmation, payloadFilename };
}

function productIdentityValues(product) {
  if (!product?.specs || typeof product.specs !== "object" || Array.isArray(product.specs)) return [];
  return PRODUCT_IDENTITY_FIELDS
    .map((field) => normalizedIdentity(product.specs[field]))
    .filter(Boolean);
}

export function validatePayload(payload, { now = Date.now() } = {}) {
  const errors = [];
  if (payload?.version !== 1 && payload?.version !== 2) errors.push("version must be 1 or 2");
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
    if (store.slugMigration !== undefined) {
      if (payload.version !== 2) errors.push(`stores[${index}].slugMigration requires version 2`);
      if (
        !store.slugMigration ||
        typeof store.slugMigration !== "object" ||
        Array.isArray(store.slugMigration) ||
        store.slugMigration.from !== null ||
        Object.keys(store.slugMigration).some((key) => key !== "from")
      ) {
        errors.push(`stores[${index}].slugMigration must explicitly contain only from:null`);
      }
    }
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
    if (payload.version === 2) {
      if (typeof listing.model !== "string" || listing.model.trim().length === 0) {
        errors.push(`listings[${index}].model is required for version 2`);
      }
      const identity = listing.verifiedIdentity;
      if (
        !identity ||
        typeof identity !== "object" ||
        Array.isArray(identity) ||
        identity.productId !== listing.productId ||
        identity.storeId !== listing.storeId ||
        identity.model !== listing.model ||
        Object.keys(identity ?? {}).some((key) => !["productId", "storeId", "model"].includes(key))
      ) {
        errors.push(`listings[${index}].verifiedIdentity must exactly repeat productId, storeId, and model`);
      }
    } else if (listing.verifiedIdentity !== undefined || listing.urlMigration !== undefined) {
      errors.push(`listings[${index}] migration fields require version 2`);
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
    if (listing.urlMigration !== undefined) {
      if (
        !listing.urlMigration ||
        typeof listing.urlMigration !== "object" ||
        Array.isArray(listing.urlMigration) ||
        !isHttpsUrl(listing.urlMigration.from) ||
        Object.keys(listing.urlMigration).some((key) => key !== "from")
      ) {
        errors.push(`listings[${index}].urlMigration must explicitly contain only an HTTPS from URL`);
      } else if (normalizedUrl(listing.urlMigration.from) === normalizedUrl(listing.productUrl)) {
        errors.push(`listings[${index}].urlMigration.from must differ from productUrl`);
      }
    }
    const verifiedAt = parseIsoTimestamp(listing.verifiedAt);
    if (verifiedAt === null) {
      errors.push(`listings[${index}].verifiedAt must be a real ISO timestamp with timezone`);
    } else if (verifiedAt > BigInt(Math.trunc(now + MAX_FUTURE_SKEW_MS)) * MICROSECONDS_PER_MILLISECOND) {
      errors.push(`listings[${index}].verifiedAt is too far in the future`);
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

function applyExactFilter(query, column, value) {
  return value === null ? query.is(column, null) : query.eq(column, value);
}

function applyStoreVersionFilters(query, existing) {
  let filtered = query.eq("id", existing.id);
  for (const column of ["slug", "name", "website_url"]) {
    filtered = applyExactFilter(filtered, column, existing[column]);
  }
  return filtered;
}

function applyListingVersionFilters(query, existing) {
  let filtered = query.eq("id", existing.id);
  for (const column of [
    "product_id",
    "store_id",
    "price_cash",
    "price_normal",
    "in_stock",
    "product_url",
    "last_updated",
  ]) {
    filtered = applyExactFilter(filtered, column, existing[column]);
  }
  return filtered;
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
    stores: { inserts: [], metadataUpdates: [], unchanged: [], conflicts: [] },
    listings: { inserts: [], updates: [], refreshes: [], unchanged: [], conflicts: [], blocked: [], outOfStock: [] },
  };
  const productById = new Map(products.map((product) => [product.id, product]));
  const storesById = groupBy(existingStores, (store) => store.id);
  const storesByUrl = groupBy(
    existingStores.filter((store) => normalizedUrl(store.website_url)),
    (store) => normalizedUrl(store.website_url),
  );
  const storesBySlug = groupBy(
    existingStores.filter((store) => typeof store.slug === "string" && store.slug.length > 0),
    (store) => store.slug,
  );
  const listingsByKey = groupBy(existingListings, listingKey);
  const listingsByUrl = groupBy(
    existingListings.filter((item) => normalizedUrl(item.product_url)),
    (item) => normalizedUrl(item.product_url),
  );

  for (const listing of payload.listings) {
    if (listing.priceCash === null) {
      const key = payloadListingKey(listing);
      plan.listings.blocked.push(conflict(
        "listing",
        "price-cash-null-schema-unconfirmed",
        key,
        `Apply cannot write priceCash:null for ${listing.productSlug}/${listing.storeId} because schema nullability is unconfirmed`,
      ));
    }
  }

  for (const store of payload.stores) {
    const matchesById = storesById.get(store.id) ?? [];
    const matchesByUrl = storesByUrl.get(normalizedUrl(store.websiteUrl)) ?? [];
    const matchesBySlug = storesBySlug.get(store.slug) ?? [];
    if (matchesById.length > 1) {
      plan.stores.conflicts.push(conflict("store", "duplicate-id", store.id, `Multiple existing stores use id ${store.id}`));
      continue;
    }
    if (matchesByUrl.some((existing) => existing.id !== store.id)) {
      plan.stores.conflicts.push(conflict("store", "duplicate-url", store.id, `Store URL is already assigned to another store: ${store.websiteUrl}`));
      continue;
    }
    if (matchesBySlug.some((existing) => existing.id !== store.id)) {
      plan.stores.conflicts.push(conflict("store", "duplicate-slug", store.id, `Store slug is already assigned to another store: ${store.slug}`));
      continue;
    }
    const existing = matchesById[0];
    if (!existing) {
      if (store.slugMigration !== undefined) {
        plan.stores.conflicts.push(conflict("store", "slug-migration-source-missing", store.id, `Slug migration cannot create or reassign store ${store.id}`));
        continue;
      }
      plan.stores.inserts.push(store);
      continue;
    }
    if (existing.name !== store.name || normalizedUrl(existing.website_url) !== normalizedUrl(store.websiteUrl)) {
      plan.stores.conflicts.push(conflict("store", "metadata-mismatch", store.id, `Existing store metadata conflicts for ${store.id}`));
      continue;
    }
    if (existing.slug !== store.slug) {
      if (store.slugMigration === undefined || existing.slug !== store.slugMigration.from) {
        plan.stores.conflicts.push(conflict("store", "metadata-mismatch", store.id, `Existing store slug conflicts for ${store.id}`));
        continue;
      }
      plan.stores.metadataUpdates.push({
        store,
        existing,
        changes: { slug: { from: existing.slug, to: store.slug } },
      });
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
    const migrationSourceUrl = listing.urlMigration ? normalizedUrl(listing.urlMigration.from) : null;
    const migrationSourceRows = migrationSourceUrl ? listingsByUrl.get(migrationSourceUrl) ?? [] : [];
    if (sameKey.length > 1) {
      plan.listings.conflicts.push(conflict("listing", "duplicate-key", key, `Multiple existing listings use ${key}`));
      continue;
    }
    if (sameUrl.some((row) => listingKey(row) !== key)) {
      plan.listings.conflicts.push(conflict("listing", "duplicate-url", key, `Listing URL is already assigned to another product/store pair: ${listing.productUrl}`));
      continue;
    }
    if (migrationSourceRows.some((row) => listingKey(row) !== key)) {
      plan.listings.conflicts.push(conflict("listing", "url-migration-source-reassigned", key, `Legacy listing URL belongs to another product/store pair: ${listing.urlMigration.from}`));
      continue;
    }

    const existing = sameKey[0];
    if (!existing) {
      if (listing.urlMigration !== undefined) {
        plan.listings.conflicts.push(conflict("listing", "url-migration-source-missing", key, `URL migration cannot create or reassign ${listing.productSlug}/${listing.storeId}`));
        continue;
      }
      plan.listings.inserts.push(listing);
      continue;
    }
    if (normalizedUrl(existing.product_url) !== normalizedUrl(listing.productUrl)) {
      if (listing.urlMigration === undefined) {
        plan.listings.conflicts.push(conflict("listing", "url-mismatch", key, `Existing listing URL conflicts for ${listing.productSlug}/${listing.storeId}`));
        continue;
      }
      if (normalizedUrl(existing.product_url) !== migrationSourceUrl) {
        plan.listings.conflicts.push(conflict("listing", "url-migration-source-mismatch", key, `Legacy listing URL does not match the explicitly approved source for ${listing.productSlug}/${listing.storeId}`));
        continue;
      }
    }
    const existingTimestamp = parseIsoTimestamp(existing.last_updated);
    const requestedTimestamp = parseIsoTimestamp(listing.verifiedAt);
    if (existingTimestamp === null) {
      plan.listings.blocked.push(conflict("listing", "invalid-last-updated", key, `Existing last_updated is invalid for ${listing.productSlug}/${listing.storeId}`));
      continue;
    }
    if (requestedTimestamp < existingTimestamp) {
      plan.listings.blocked.push(conflict("listing", "stale-verified-at", key, `verifiedAt is older than existing last_updated for ${listing.productSlug}/${listing.storeId}`));
      continue;
    }
    if (requestedTimestamp === existingTimestamp) {
      if (listingMatches(existing, listing)) {
        plan.listings.unchanged.push(listing);
      } else {
        plan.listings.blocked.push(conflict("listing", "timestamp-collision", key, `Equal verifiedAt cannot change commercial data for ${listing.productSlug}/${listing.storeId}`));
      }
      continue;
    }

    if (listingMatches(existing, listing)) {
      plan.listings.refreshes.push({ listing, existing });
      continue;
    }

    const changes = {};
    if (existing.price_cash !== listing.priceCash) changes.priceCash = { from: existing.price_cash, to: listing.priceCash };
    if (existing.price_normal !== listing.priceNormal) changes.priceNormal = { from: existing.price_normal, to: listing.priceNormal };
    if (existing.in_stock !== listing.inStock) changes.inStock = { from: existing.in_stock, to: listing.inStock };
    if (normalizedUrl(existing.product_url) !== normalizedUrl(listing.productUrl)) {
      changes.productUrl = { from: existing.product_url, to: listing.productUrl };
    }
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
    storesToUpdate: plan.stores.metadataUpdates.length,
    listingsPrepared: plan.prepared.listings,
    listingsToInsert: plan.listings.inserts.length,
    listingsToUpdate: plan.listings.updates.length,
    listingsToRefresh: plan.listings.refreshes.length,
    listingUrlsToMigrate: plan.listings.updates.filter(({ changes }) => changes.productUrl !== undefined).length,
    productsCovered: plan.prepared.productsCovered,
    alreadyCurrent: plan.listings.unchanged.length,
    conflicts: plan.stores.conflicts.length + plan.listings.conflicts.length,
    blocked: plan.listings.blocked.length,
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
  for (const item of plan.listings.blocked) {
    logger(`BLOCKED ${item.code} ${item.key}: ${item.message}`);
  }
}

export class PartialApplyError extends Error {
  constructor(message, execution, cause) {
    super(message, { cause });
    this.name = "PartialApplyError";
    this.execution = execution;
  }
}

/**
 * @param {{
 *   supabase: any,
 *   payload: any,
 *   isApply?: boolean,
 *   confirmation?: string,
 *   logger?: (message: string) => void,
 * }} options
 */
export async function runMaintenance({ supabase, payload, isApply = false, confirmation, logger = console.log }) {
  const validationErrors = validatePayload(payload);
  if (validationErrors.length > 0) throw new Error(`Invalid payload:\n- ${validationErrors.join("\n- ")}`);
  const applyConfirmation = payload.version === 2 ? APPLY_CONFIRMATION_V2 : APPLY_CONFIRMATION;
  if (isApply && confirmation !== applyConfirmation) throw new Error(`Apply requires --confirm=${applyConfirmation}`);

  const state = await readCurrentState(supabase, payload);
  const plan = buildMaintenancePlan({ payload, ...state });
  const summary = summarizePlan(plan, isApply ? "apply" : "dry-run");

  if (!isApply) {
    logger(JSON.stringify(summary, null, 2));
    logConflicts(plan, logger);
    logger(`Dry-run only. Use --apply --confirm=${applyConfirmation} after authentic retailer verification.`);
    return { summary, plan, writesPerformed: false };
  }
  if (summary.conflicts > 0 || summary.blocked > 0) {
    logConflicts(plan, logger);
    throw new Error("Apply blocked because all conflicts and blocked listings must be resolved before any write");
  }

  let writeAttempted = false;
  const execution = {
    status: "applying",
    storesInserted: 0,
    storesUpdated: 0,
    listingsInserted: 0,
    listingsUpdated: 0,
    listingsRefreshed: 0,
  };
  let postPlan;
  let postSummary;
  try {
    if (plan.stores.inserts.length > 0) {
      writeAttempted = true;
      assertNoError(
        await supabase.from("stores").insert(plan.stores.inserts.map((store) => ({
          id: store.id,
          slug: store.slug,
          name: store.name,
          website_url: store.websiteUrl,
        }))),
        "Store insert failed",
      );
      execution.storesInserted = plan.stores.inserts.length;
    }
    for (const { store, existing } of plan.stores.metadataUpdates) {
      writeAttempted = true;
      const updateQuery = applyStoreVersionFilters(
        supabase.from("stores").update({ slug: store.slug }),
        existing,
      );
      const updatedRows = assertNoError(
        await updateQuery.select("id"),
        `Store metadata update failed for ${store.id}`,
      );
      if (updatedRows.length !== 1) throw new Error(`Store metadata update lost its preflight version for ${store.id}`);
      execution.storesUpdated += 1;
    }
    if (plan.listings.inserts.length > 0) {
      writeAttempted = true;
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
      execution.listingsInserted = plan.listings.inserts.length;
    }
    for (const { listing, existing } of plan.listings.updates) {
      writeAttempted = true;
      const updateQuery = applyListingVersionFilters(
        supabase.from("store_listings").update({
          price_cash: listing.priceCash,
          price_normal: listing.priceNormal,
          in_stock: listing.inStock,
          product_url: listing.productUrl,
          last_updated: listing.verifiedAt,
        }),
        existing,
      );
      const updatedRows = assertNoError(
        await updateQuery.select("id"),
        `Listing update failed for ${listing.productSlug}/${listing.storeId}`,
      );
      if (updatedRows.length !== 1) throw new Error(`Listing update lost its preflight version for ${listing.productSlug}/${listing.storeId}`);
      execution.listingsUpdated += 1;
    }
    for (const { listing, existing } of plan.listings.refreshes) {
      writeAttempted = true;
      const updateQuery = applyListingVersionFilters(
        supabase.from("store_listings").update({ last_updated: listing.verifiedAt }),
        existing,
      );
      const updatedRows = assertNoError(
        await updateQuery.select("id"),
        `Listing freshness update failed for ${listing.productSlug}/${listing.storeId}`,
      );
      if (updatedRows.length !== 1) throw new Error(`Listing freshness update lost its preflight version for ${listing.productSlug}/${listing.storeId}`);
      execution.listingsRefreshed += 1;
    }

    const postState = await readCurrentState(supabase, payload);
    postPlan = buildMaintenancePlan({ payload, ...postState });
    postSummary = summarizePlan(postPlan, "post-apply-dry-run");
    if (
      postSummary.storesToInsert !== 0 ||
      postSummary.storesToUpdate !== 0 ||
      postSummary.listingsToInsert !== 0 ||
      postSummary.listingsToUpdate !== 0 ||
      postSummary.listingsToRefresh !== 0 ||
      postSummary.conflicts !== 0 ||
      postSummary.blocked !== 0 ||
      postSummary.alreadyCurrent !== payload.listings.length ||
      postPlan.stores.unchanged.length !== payload.stores.length
    ) {
      throw new Error("Post-apply read-back is not idempotent");
    }
  } catch (error) {
    if (!writeAttempted) throw error;
    execution.status = "partial-or-unknown";
    logger(JSON.stringify(execution, null, 2));
    throw new PartialApplyError(
      "Apply stopped with partial or uncertain execution. No multi-operation transaction exists; re-run dry-run, reconcile the reported state, then retry the same payload idempotently.",
      execution,
      error,
    );
  }

  execution.status = "verified";
  const result = {
    ...summary,
    verifiedStores: postPlan.stores.unchanged.length,
    verifiedListings: postSummary.alreadyCurrent,
    idempotent: true,
    execution,
  };
  logger(JSON.stringify(result, null, 2));
  return { summary: result, plan, postPlan, writesPerformed: writeAttempted };
}

async function loadPayload(filename) {
  return JSON.parse(await readFile(resolvePayloadPath(filename), "utf8"));
}

async function main() {
  const { isApply, confirmation, payloadFilename } = parseCliOptions(process.argv.slice(2));
  const payload = await loadPayload(payloadFilename);
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
