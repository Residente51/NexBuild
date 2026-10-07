import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rankGuidedCandidates, type GuidedProfile } from "@/lib/build/guidance";
import { evaluateBuild } from "@/lib/compatibility/engine";
import { parseProductRow } from "@/lib/components/validation";
import type { CPUComponent, GPUComponent, MotherboardComponent, PSUComponent, RAMComponent, StorageComponent } from "@/types/component";

type ExpansionProduct = {
  slug: string;
  name: string;
  brand: string;
  category: "case" | "cooler";
  specs: Record<string, unknown>;
  listing: { priceCash: number; inStock: boolean; productUrl: string };
};

const payloadPath = resolve(process.cwd(), "scripts/catalog-expansion-v1.json");
const payload = JSON.parse(readFileSync(payloadPath, "utf8")) as { products: ExpansionProduct[] };
const profile: GuidedProfile = { useCase: "gaming", budget: 1_500_000, priority: "balanced" };

const cpu: CPUComponent = {
  id: "cpu-example", slug: "cpu-example", name: "CPU example", brand: "AMD", category: "cpu", price: 220_000,
  specs: { socket: "AM5", tdp: 105, hasIntegratedGraphics: false, includesCooler: false, cores: 6 },
};
const motherboard: MotherboardComponent = {
  id: "motherboard-example", slug: "motherboard-example", name: "Motherboard example", brand: "MSI", category: "motherboard", price: 160_000,
  specs: { socket: "AM5", formFactor: "ATX", ramType: "ddr5", ramSlots: 4, m2Slots: 2, sataPorts: 4 },
};
const ram: RAMComponent = {
  id: "ram-example", slug: "ram-example", name: "RAM example", brand: "Corsair", category: "ram", price: 120_000,
  specs: { ramType: "ddr5", modules: 2, capacityPerModule: 16 },
};
const gpu: GPUComponent = {
  id: "gpu-example", slug: "gpu-example", name: "GPU example", brand: "MSI", category: "gpu", price: 320_000,
  specs: { length: 240, slotWidth: 2, recommendedPsuWattage: 550, powerDraw: 115, vram: 8 },
};
const storage: StorageComponent = {
  id: "storage-example", slug: "storage-example", name: "Storage example", brand: "Kingston", category: "storage", price: 80_000,
  specs: { type: "nvme", formFactor: "m.2 2280", capacity: 1000 },
};
const psu: PSUComponent = {
  id: "psu-example", slug: "psu-example", name: "PSU example", brand: "Corsair", category: "psu", price: 115_000,
  specs: { wattage: 750, formFactor: "atx" },
};

describe("Catalog/Data Expansion 1.0 payload", () => {
  const parsed = payload.products.map((product, index) => parseProductRow({
    id: `expansion-${index}`,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    specs: product.specs,
    image_url: null,
    description: null,
    store_listings: [{ price_cash: product.listing.priceCash, in_stock: product.listing.inStock, product_url: product.listing.productUrl }],
  }));

  it("has three valid, uniquely-slugged options for each blocked category", () => {
    expect(parsed.every(Boolean)).toBe(true);
    expect(new Set(payload.products.map((product) => product.slug)).size).toBe(payload.products.length);
    expect(payload.products.filter((product) => product.category === "case")).toHaveLength(3);
    expect(payload.products.filter((product) => product.category === "cooler")).toHaveLength(3);
    expect(payload.products.every((product) => Number.isSafeInteger(product.listing.priceCash) && product.listing.priceCash > 0)).toBe(true);
  });

  it("can complete a compatible build and rank the prepared options", () => {
    const pcCase = parsed.find((product) => product?.slug === "cooler-master-masterbox-td500-mesh");
    const cooler = parsed.find((product) => product?.slug === "cooler-master-hyper-212-halo-black");
    expect(pcCase?.category).toBe("case");
    expect(cooler?.category).toBe("cooler");
    if (!pcCase || pcCase.category !== "case" || !cooler || cooler.category !== "cooler") throw new Error("Prepared catalog entry missing");

    const build = { cpu, motherboard, ram, gpu, storage: [storage], psu, case: pcCase, cooler };
    expect(evaluateBuild(build).status).toBe("compatible");
    expect(rankGuidedCandidates(profile, { ...build, case: undefined }, parsed.filter((product): product is NonNullable<typeof product> => product?.category === "case"), "case")).not.toHaveLength(0);
    expect(rankGuidedCandidates(profile, { ...build, cooler: undefined }, parsed.filter((product): product is NonNullable<typeof product> => product?.category === "cooler"), "cooler")).not.toHaveLength(0);
  });
});
