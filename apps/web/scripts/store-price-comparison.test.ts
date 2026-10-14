import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Payload = {
  stores: Array<{ id: string; websiteUrl: string }>;
  listings: Array<{
    productId: string;
    storeId: string;
    priceCash: number;
    priceNormal: number | null;
    productUrl: string;
  }>;
};

const payload = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/store-price-comparison-v1.json"), "utf8"),
) as Payload;

describe("Stores & Price Comparison 1.0 payload", () => {
  it("usa tiendas y pares producto/tienda únicos", () => {
    const storeIds = payload.stores.map((store) => store.id);
    const listingKeys = payload.listings.map(
      (listing) => `${listing.productId}:${listing.storeId}`,
    );

    expect(new Set(storeIds).size).toBe(storeIds.length);
    expect(new Set(listingKeys).size).toBe(listingKeys.length);
    expect(payload.listings.every((listing) => storeIds.includes(listing.storeId))).toBe(true);
  });

  it("solo contiene precios enteros positivos y URLs HTTPS", () => {
    expect(
      payload.listings.every(
        (listing) =>
          Number.isSafeInteger(listing.priceCash) &&
          listing.priceCash > 0 &&
          (listing.priceNormal === null ||
            (Number.isSafeInteger(listing.priceNormal) && listing.priceNormal > 0)) &&
          listing.productUrl.startsWith("https://"),
      ),
    ).toBe(true);
    expect(payload.stores.every((store) => store.websiteUrl.startsWith("https://"))).toBe(true);
  });
});
