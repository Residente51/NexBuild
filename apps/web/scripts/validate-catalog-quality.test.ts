import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseProductRow } from "@/lib/components/validation";

type QualityUpdate = {
  id: string;
  slug: string;
  expectedName: string;
  expectedCurrent: { image_url: string | null; description?: string | null };
  update: { image_url: string; description?: string };
  sources: { productPage: string; imageAsset: string };
};

type ExpansionProduct = {
  slug: string;
  name: string;
  brand: string;
  category: "case" | "cooler";
  specs: Record<string, unknown>;
  listing: { priceCash: number; inStock: boolean; productUrl: string };
};

const qualityPayload = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/catalog-quality-v1.json"), "utf8"),
) as { updates: QualityUpdate[] };
const expansionPayload = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/catalog-expansion-v1.json"), "utf8"),
) as { products: ExpansionProduct[] };

const expectedTargetSlugs = [
  "cooler-master-masterbox-td500-mesh",
  "cooler-master-masterbox-td300-mesh-black",
  "cooler-master-masterbox-td300-mesh-white",
  "cooler-master-hyper-212-halo-black",
  "cooler-master-hyper-212-3dhp-black-argb",
  "cooler-master-hyper-212-spectrum-v3",
  "asus-prime-h610m-e-d4",
  "asus-rog-strix-x670e-f-gaming-wifi",
  "asus-rog-thor-1000w-platinum-ii",
  "asus-tuf-gaming-geforce-rtx-4080-super",
  "asus-tuf-gaming-x570-plus",
];

describe("Product Imagery & Catalog Quality 1.0 payload", () => {
  it("targets each intended product exactly once without changing slugs", () => {
    const slugs = qualityPayload.updates.map((entry) => entry.slug);
    expect(slugs).toEqual(expectedTargetSlugs);
    expect(new Set(slugs).size).toBe(expectedTargetSlugs.length);
    expect(qualityPayload.updates.every((entry) => !("slug" in entry.update))).toBe(true);
  });

  it("uses HTTPS image assets and short, non-empty descriptions", () => {
    for (const entry of qualityPayload.updates) {
      expect(new URL(entry.update.image_url).protocol).toBe("https:");
      expect(entry.sources.imageAsset).toBe(entry.update.image_url);
    }
    const descriptions = qualityPayload.updates.flatMap((entry) =>
      entry.update.description ? [entry.update.description] : [],
    );
    expect(descriptions).toHaveLength(6);
    expect(descriptions.every((description) => description.trim().length > 0)).toBe(true);
    expect(descriptions.every((description) => description.length <= 300)).toBe(true);
  });

  it("keeps targets unique by both id and slug", () => {
    expect(new Set(qualityPayload.updates.map((entry) => entry.id)).size).toBe(11);
    expect(new Set(qualityPayload.updates.map((entry) => entry.slug)).size).toBe(11);
  });

  it("is accepted by parseProductRow for all six enriched Cooler Master rows", () => {
    const updatesBySlug = new Map(
      qualityPayload.updates.map((entry) => [entry.slug, entry]),
    );
    const parsed = expansionPayload.products.map((product) => {
      const quality = updatesBySlug.get(product.slug);
      return parseProductRow({
        id: quality?.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        specs: product.specs,
        image_url: quality?.update.image_url,
        description: quality?.update.description,
        store_listings: [
          {
            price_cash: product.listing.priceCash,
            in_stock: product.listing.inStock,
            product_url: product.listing.productUrl,
          },
        ],
      });
    });

    expect(parsed).toHaveLength(6);
    expect(parsed.every((product) => product?.image?.startsWith("https://"))).toBe(true);
    expect(parsed.every((product) => Boolean(product?.description))).toBe(true);
  });
});
