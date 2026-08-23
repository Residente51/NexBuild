/**
 * Seed data for compatibility engine testing.
 *
 * Each constant is a real-world component with specs filled to match
 * the interfaces in `types/component.ts`. Prices are in CLP.
 *
 * This file is NOT the production catalog (see `data/components.ts`).
 * It exists solely for validating compatibility rules.
 */

import type {
  CPUComponent,
  MotherboardComponent,
  RAMComponent,
  GPUComponent,
  StorageComponent,
  CaseComponent,
  PSUComponent,
  CoolerComponent,
  PCComponent,
} from "@/types/component";

// ---------------------------------------------------------------------------
// CPUs
// ---------------------------------------------------------------------------

export const cpuRyzen7_7700X: CPUComponent = {
  id: "901",
  slug: "amd-ryzen-7-7700x",
  name: "AMD Ryzen 7 7700X",
  brand: "AMD",
  category: "cpu",
  price: 289990,
  specs: {
    socket: "AM5",
    tdp: 105,
    hasIntegratedGraphics: true,
    includesCooler: false,
  },
};

export const cpuIntelI5_13600K: CPUComponent = {
  id: "902",
  slug: "intel-core-i5-13600k",
  name: "Intel Core i5-13600K",
  brand: "Intel",
  category: "cpu",
  price: 259990,
  specs: {
    socket: "LGA1700",
    tdp: 125,
    hasIntegratedGraphics: true,
    includesCooler: false,
  },
};

// ---------------------------------------------------------------------------
// Motherboards
// ---------------------------------------------------------------------------

export const mbMsiB650TomahawkWifi: MotherboardComponent = {
  id: "903",
  slug: "msi-mag-b650-tomahawk-wifi",
  name: "MSI MAG B650 TOMAHAWK WIFI",
  brand: "MSI",
  category: "motherboard",
  price: 189990,
  specs: {
    socket: "AM5",
    formFactor: "ATX",
    ramType: "ddr5",
    ramSlots: 4,
    m2Slots: 2,
    sataPorts: 6,
  },
};

export const mbGigabyteB760mDS3H: MotherboardComponent = {
  id: "904",
  slug: "gigabyte-b760m-ds3h",
  name: "Gigabyte B760M DS3H",
  brand: "Gigabyte",
  category: "motherboard",
  price: 89990,
  specs: {
    socket: "LGA1700",
    formFactor: "Micro-ATX",
    ramType: "ddr4",
    ramSlots: 2,
    m2Slots: 1,
    sataPorts: 4,
  },
};

// ---------------------------------------------------------------------------
// RAM
// ---------------------------------------------------------------------------

export const ramCorsairVengeanceDdr5: RAMComponent = {
  id: "905",
  slug: "corsair-vengeance-ddr5-32gb-5600",
  name: "Corsair Vengeance DDR5 32GB (2x16GB) 5600MHz",
  brand: "Corsair",
  category: "ram",
  price: 109990,
  specs: {
    ramType: "ddr5",
    modules: 2,
    capacityPerModule: 16,
  },
};

export const ramKingstonFuryDdr4: RAMComponent = {
  id: "906",
  slug: "kingston-fury-beast-ddr4-16gb-3200",
  name: "Kingston FURY Beast DDR4 16GB (2x8GB) 3200MHz",
  brand: "Kingston",
  category: "ram",
  price: 39990,
  specs: {
    ramType: "ddr4",
    modules: 2,
    capacityPerModule: 8,
  },
};

// ---------------------------------------------------------------------------
// GPUs
// ---------------------------------------------------------------------------

export const gpuRtx4080Super: GPUComponent = {
  id: "907",
  slug: "msi-geforce-rtx-4080-super-ventus-3x-oc",
  name: "MSI GeForce RTX 4080 SUPER VENTUS 3X OC",
  brand: "MSI",
  category: "gpu",
  price: 949990,
  specs: {
    length: 342,
    slotWidth: 3,
    recommendedPsuWattage: 750,
  },
};

export const gpuRtx4060: GPUComponent = {
  id: "908",
  slug: "gigabyte-geforce-rtx-4060-eagle-oc",
  name: "Gigabyte GeForce RTX 4060 EAGLE OC 8GB",
  brand: "Gigabyte",
  category: "gpu",
  price: 329990,
  specs: {
    length: 224,
    slotWidth: 2,
    recommendedPsuWattage: 500,
  },
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const caseNzxtH6Flow: CaseComponent = {
  id: "909",
  slug: "nzxt-h6-flow",
  name: "NZXT H6 Flow",
  brand: "NZXT",
  category: "case",
  price: 99990,
  specs: {
    supportedMotherboards: ["ATX", "Micro-ATX", "Mini-ITX"],
    maxGpuLength: 365,
    maxCoolerHeight: 163,
    supportedPsuFormFactors: ["atx"],
    radiatorSupport: ["120", "140", "240", "280", "360"],
  },
};

export const caseFractalTerra: CaseComponent = {
  id: "910",
  slug: "fractal-design-terra",
  name: "Fractal Design Terra",
  brand: "Fractal Design",
  category: "case",
  price: 149990,
  specs: {
    supportedMotherboards: ["Mini-ITX"],
    maxGpuLength: 322,
    maxCoolerHeight: 77,
    supportedPsuFormFactors: ["sfx", "sfx-l"],
    radiatorSupport: [],
  },
};

// ---------------------------------------------------------------------------
// PSUs
// ---------------------------------------------------------------------------

export const psuCorsairRM850x: PSUComponent = {
  id: "911",
  slug: "corsair-rm850x-2024",
  name: "Corsair RM850x (2024)",
  brand: "Corsair",
  category: "psu",
  price: 119990,
  specs: {
    wattage: 850,
    formFactor: "atx",
  },
};

export const psuEvga450BR: PSUComponent = {
  id: "912",
  slug: "evga-450-br",
  name: "EVGA 450 BR",
  brand: "EVGA",
  category: "psu",
  price: 39990,
  specs: {
    wattage: 450,
    formFactor: "atx",
  },
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export const storageNvme: StorageComponent = {
  id: "913",
  slug: "kingston-nv2-1tb",
  name: "Kingston NV2 1TB PCIe 4.0 NVMe M.2",
  brand: "Kingston",
  category: "storage",
  price: 64990,
  specs: {
    type: "nvme",
    formFactor: "m.2 2280",
    capacity: 1000,
  },
};

export const storageSata: StorageComponent = {
  id: "914",
  slug: "crucial-bx500-1tb",
  name: "Crucial BX500 1TB SATA III",
  brand: "Crucial",
  category: "storage",
  price: 54990,
  specs: {
    type: "sata",
    formFactor: "2.5",
    capacity: 1000,
  },
};

// ---------------------------------------------------------------------------
// Coolers
// ---------------------------------------------------------------------------

export const coolerAir: CoolerComponent = {
  id: "915",
  slug: "noctua-nh-d15",
  name: "Noctua NH-D15",
  brand: "Noctua",
  category: "cooler",
  price: 109990,
  specs: {
    type: "air",
    supportedSockets: ["AM5", "LGA1700"],
    height: 165,
  },
};

export const coolerAio: CoolerComponent = {
  id: "916",
  slug: "nzxt-kraken-240",
  name: "NZXT Kraken 240",
  brand: "NZXT",
  category: "cooler",
  price: 134990,
  specs: {
    type: "aio",
    supportedSockets: ["AM5", "LGA1700"],
    radiatorSize: "240",
  },
};

// ---------------------------------------------------------------------------
// Aggregated catalog for convenience
// ---------------------------------------------------------------------------

export const mockCatalog: PCComponent[] = [
  cpuRyzen7_7700X,
  cpuIntelI5_13600K,
  mbMsiB650TomahawkWifi,
  mbGigabyteB760mDS3H,
  ramCorsairVengeanceDdr5,
  ramKingstonFuryDdr4,
  gpuRtx4080Super,
  gpuRtx4060,
  storageNvme,
  storageSata,
  caseNzxtH6Flow,
  caseFractalTerra,
  psuCorsairRM850x,
  psuEvga450BR,
  coolerAir,
  coolerAio,
];
