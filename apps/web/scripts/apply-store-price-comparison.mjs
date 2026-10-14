import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PAYLOAD_PATH = resolve(SCRIPT_DIR, "store-price-comparison-v1.json");
const APPLY_CONFIRMATION = "stores-price-comparison-v1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function validatePayload(payload) {
  const errors = [];
  if (payload?.version !== 1) errors.push("version must be 1");
  if (!Array.isArray(payload?.stores) || payload.stores.length === 0) {
    errors.push("stores must be a non-empty array");
  }
  if (!Array.isArray(payload?.listings) || payload.listings.length === 0) {
    errors.push("listings must be a non-empty array");
  }
  if (errors.length > 0) return errors;

  const storeIds = new Set();
  const storeSlugs = new Set();
  for (const [index, store] of payload.stores.entries()) {
    if (!/^[a-z0-9-]+$/.test(store.id ?? "")) errors.push(`stores[${index}].id is invalid`);
    if (!/^[a-z0-9-]+$/.test(store.slug ?? "")) errors.push(`stores[${index}].slug is invalid`);
    if (typeof store.name !== "string" || store.name.trim().length === 0) errors.push(`stores[${index}].name is invalid`);
    if (!isHttpsUrl(store.websiteUrl)) errors.push(`stores[${index}].websiteUrl must use HTTPS`);
    if (storeIds.has(store.id)) errors.push(`duplicate store id ${store.id}`);
    if (storeSlugs.has(store.slug)) errors.push(`duplicate store slug ${store.slug}`);
    storeIds.add(store.id);
    storeSlugs.add(store.slug);
  }

  const listingKeys = new Set();
  for (const [index, listing] of payload.listings.entries()) {
    if (!UUID_PATTERN.test(listing.productId ?? "")) errors.push(`listings[${index}].productId is invalid`);
    if (typeof listing.productSlug !== "string" || listing.productSlug.length === 0) errors.push(`listings[${index}].productSlug is invalid`);
    if (typeof listing.model !== "string" || listing.model.length === 0) errors.push(`listings[${index}].model is invalid`);
    if (!storeIds.has(listing.storeId)) errors.push(`listings[${index}].storeId is unknown`);
    if (!isPositiveInteger(listing.priceCash)) errors.push(`listings[${index}].priceCash must be a positive integer`);
    if (listing.priceNormal !== null && !isPositiveInteger(listing.priceNormal)) errors.push(`listings[${index}].priceNormal must be null or a positive integer`);
    if (typeof listing.inStock !== "boolean") errors.push(`listings[${index}].inStock must be boolean`);
    if (!isHttpsUrl(listing.productUrl)) errors.push(`listings[${index}].productUrl must use HTTPS`);
    if (Number.isNaN(Date.parse(listing.verifiedAt))) errors.push(`listings[${index}].verifiedAt is invalid`);

    const key = `${listing.productId}:${listing.storeId}`;
    if (listingKeys.has(key)) errors.push(`duplicate product/store pair ${key}`);
    listingKeys.add(key);
  }

  return errors;
}

function assertNoError(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data ?? [];
}

function listingMatches(row, listing) {
  return row.product_id === listing.productId &&
    row.store_id === listing.storeId &&
    row.price_cash === listing.priceCash &&
    row.price_normal === listing.priceNormal &&
    row.in_stock === listing.inStock &&
    row.product_url === listing.productUrl;
}

async function loadPayload() {
  return JSON.parse(await readFile(PAYLOAD_PATH, "utf8"));
}

async function main() {
  const payload = await loadPayload();
  const validationErrors = validatePayload(payload);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid payload:\n- ${validationErrors.join("\n- ")}`);
  }

  const isApply = process.argv.includes("--apply");
  const confirmation = process.argv.find((argument) => argument.startsWith("--confirm="))?.split("=")[1];
  if (isApply && confirmation !== APPLY_CONFIRMATION) {
    throw new Error(`Apply requires --confirm=${APPLY_CONFIRMATION}`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const productIds = [...new Set(payload.listings.map((listing) => listing.productId))];
  const storeIds = payload.stores.map((store) => store.id);

  const products = assertNoError(
    await supabase.from("products").select("id,slug,name,is_active").in("id", productIds),
    "Product preflight failed",
  );
  const productById = new Map(products.map((product) => [product.id, product]));
  for (const listing of payload.listings) {
    const product = productById.get(listing.productId);
    if (!product || product.slug !== listing.productSlug || product.is_active !== true) {
      throw new Error(`Product identity mismatch for ${listing.productSlug}`);
    }
  }

  const existingStores = assertNoError(
    await supabase.from("stores").select("id,slug,name,website_url").in("id", storeIds),
    "Store preflight failed",
  );
  const existingStoreById = new Map(existingStores.map((store) => [store.id, store]));
  for (const store of payload.stores) {
    const existing = existingStoreById.get(store.id);
    if (existing && (existing.slug !== store.slug || existing.name !== store.name || existing.website_url !== store.websiteUrl)) {
      throw new Error(`Existing store metadata conflicts for ${store.id}`);
    }
  }

  const existingListings = assertNoError(
    await supabase
      .from("store_listings")
      .select("id,product_id,store_id,price_cash,price_normal,in_stock,product_url")
      .in("product_id", productIds)
      .in("store_id", storeIds),
    "Listing preflight failed",
  );
  const existingByKey = new Map(existingListings.map((row) => [`${row.product_id}:${row.store_id}`, row]));
  const pendingListings = [];
  for (const listing of payload.listings) {
    const existing = existingByKey.get(`${listing.productId}:${listing.storeId}`);
    if (!existing) pendingListings.push(listing);
    else if (!listingMatches(existing, listing)) throw new Error(`Existing listing conflicts for ${listing.productSlug}/${listing.storeId}`);
  }

  const pendingStores = payload.stores.filter((store) => !existingStoreById.has(store.id));
  const summary = {
    mode: isApply ? "apply" : "dry-run",
    storesPrepared: payload.stores.length,
    storesToInsert: pendingStores.length,
    listingsPrepared: payload.listings.length,
    listingsToInsert: pendingListings.length,
    productsCovered: productIds.length,
    alreadyCurrent: payload.listings.length - pendingListings.length,
  };

  if (!isApply) {
    console.log(JSON.stringify(summary, null, 2));
    console.log(`Dry-run only. Use --apply --confirm=${APPLY_CONFIRMATION} after reviewing current retailer data.`);
    return;
  }

  if (pendingStores.length > 0) {
    assertNoError(
      await supabase.from("stores").insert(pendingStores.map((store) => ({
        id: store.id,
        slug: store.slug,
        name: store.name,
        website_url: store.websiteUrl,
      }))),
      "Store insert failed",
    );
  }

  if (pendingListings.length > 0) {
    assertNoError(
      await supabase.from("store_listings").insert(pendingListings.map((listing) => ({
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

  const readBackStores = assertNoError(
    await supabase.from("stores").select("id,slug,name,website_url").in("id", storeIds),
    "Store read-back failed",
  );
  const readBackListings = assertNoError(
    await supabase
      .from("store_listings")
      .select("id,product_id,store_id,price_cash,price_normal,in_stock,product_url,last_updated")
      .in("product_id", productIds)
      .in("store_id", storeIds),
    "Listing read-back failed",
  );
  const readBackByKey = new Map(readBackListings.map((row) => [`${row.product_id}:${row.store_id}`, row]));
  if (readBackStores.length !== payload.stores.length) throw new Error("Store read-back count mismatch");
  for (const listing of payload.listings) {
    const row = readBackByKey.get(`${listing.productId}:${listing.storeId}`);
    if (!row || !listingMatches(row, listing)) throw new Error(`Listing read-back mismatch for ${listing.productSlug}/${listing.storeId}`);
  }

  console.log(JSON.stringify({ ...summary, verifiedStores: readBackStores.length, verifiedListings: payload.listings.length }, null, 2));
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Unknown apply error");
    process.exitCode = 1;
  });
}
