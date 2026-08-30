/**
 * Enrich Catalog Script
 *
 * Updates the 40 existing products in the Supabase `products` table with:
 * - image_url: HTTPS URL to a product image
 * - description: 1-2 line Spanish description
 * - specs: Full JSONB preserving all compatibility-engine fields + enrichment fields
 *
 * Usage:
 *   node apps/web/scripts/enrich-catalog.mjs
 *
 * Prerequisites:
 *   - .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   - The `products` table must have `image_url` (TEXT) and `description` (TEXT) columns
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// ---------------------------------------------------------------------------
// Supabase client (service role for RLS bypass)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Enrichment data — keyed by product slug
// ---------------------------------------------------------------------------

const enrichmentData = {
  // =========================================================================
  // CPUs (10)
  // =========================================================================

  "amd-ryzen-5-5600x": {
    image_url:
      "https://m.media-amazon.com/images/I/51f2hkGMYtL._AC_SL1200_.jpg",
    description:
      "Procesador de 6 núcleos y 12 hilos con arquitectura Zen 3, excelente relación precio-rendimiento para gaming y productividad.",
    specs: {
      socket: "AM4",
      tdp: 65,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 6,
      threads: 12,
      baseClock: 3.7,
      boostClock: 4.6,
      cache: 32,
      architecture: "Zen 3",
    },
  },

  "amd-ryzen-7-5800x3d": {
    image_url:
      "https://m.media-amazon.com/images/I/51GSXQWP-wL._AC_SL1200_.jpg",
    description:
      "Procesador de 8 núcleos con tecnología 3D V-Cache y 96 MB de caché L3, líder en rendimiento gaming en plataforma AM4.",
    specs: {
      socket: "AM4",
      tdp: 105,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 8,
      threads: 16,
      baseClock: 3.4,
      boostClock: 4.5,
      cache: 96,
      architecture: "Zen 3 (3D V-Cache)",
    },
  },

  "amd-ryzen-5-7600x": {
    image_url:
      "https://m.media-amazon.com/images/I/51Ds8M3iBqL._AC_SL1200_.jpg",
    description:
      "Procesador de 6 núcleos Zen 4 con soporte DDR5 y PCIe 5.0, ideal para gaming en plataforma AM5.",
    specs: {
      socket: "AM5",
      tdp: 105,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 6,
      threads: 12,
      baseClock: 4.7,
      boostClock: 5.3,
      cache: 32,
      architecture: "Zen 4",
    },
  },

  "amd-ryzen-7-7800x3d": {
    image_url:
      "https://m.media-amazon.com/images/I/51hnm5-VTgL._AC_SL1200_.jpg",
    description:
      "El procesador gaming más rápido del mundo con 3D V-Cache de 96 MB y arquitectura Zen 4 en plataforma AM5.",
    specs: {
      socket: "AM5",
      tdp: 120,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 8,
      threads: 16,
      baseClock: 4.2,
      boostClock: 5.0,
      cache: 96,
      architecture: "Zen 4 (3D V-Cache)",
    },
  },

  "amd-ryzen-9-7950x": {
    image_url:
      "https://m.media-amazon.com/images/I/51CcSAr0e7L._AC_SL1200_.jpg",
    description:
      "Procesador tope de línea con 16 núcleos y 32 hilos Zen 4, diseñado para cargas de trabajo profesionales y creación de contenido.",
    specs: {
      socket: "AM5",
      tdp: 170,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 16,
      threads: 32,
      baseClock: 4.5,
      boostClock: 5.7,
      cache: 64,
      architecture: "Zen 4",
    },
  },

  "intel-core-i5-12400f": {
    image_url:
      "https://m.media-amazon.com/images/I/51SmsJHBYhL._AC_SL1500_.jpg",
    description:
      "Procesador de 6 núcleos Alder Lake sin gráficos integrados, una de las mejores opciones calidad-precio para gaming.",
    specs: {
      socket: "LGA1700",
      tdp: 65,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 6,
      threads: 12,
      baseClock: 2.5,
      boostClock: 4.4,
      cache: 18,
      architecture: "Alder Lake",
    },
  },

  "intel-core-i5-13600k": {
    image_url:
      "https://m.media-amazon.com/images/I/51G06ANqAqL._AC_SL1500_.jpg",
    description:
      "Procesador de 14 núcleos (6P+8E) desbloqueado, combinando alto rendimiento en gaming y multitarea con arquitectura Raptor Lake.",
    specs: {
      socket: "LGA1700",
      tdp: 125,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 14,
      threads: 20,
      baseClock: 3.5,
      boostClock: 5.1,
      cache: 24,
      architecture: "Raptor Lake",
      pCores: 6,
      eCores: 8,
    },
  },

  "intel-core-i7-13700k": {
    image_url:
      "https://m.media-amazon.com/images/I/51G06ANqAqL._AC_SL1500_.jpg",
    description:
      "Procesador de 16 núcleos (8P+8E) de alto rendimiento, excelente para gaming competitivo y creación de contenido.",
    specs: {
      socket: "LGA1700",
      tdp: 125,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 16,
      threads: 24,
      baseClock: 3.4,
      boostClock: 5.4,
      cache: 30,
      architecture: "Raptor Lake",
      pCores: 8,
      eCores: 8,
    },
  },

  "intel-core-i5-14600k": {
    image_url:
      "https://m.media-amazon.com/images/I/51gCKLZ3elL._AC_SL1500_.jpg",
    description:
      "Procesador de 14 núcleos (6P+8E) Raptor Lake Refresh desbloqueado, mejora iterativa del i5-13600K para gaming y productividad.",
    specs: {
      socket: "LGA1700",
      tdp: 125,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 14,
      threads: 20,
      baseClock: 3.5,
      boostClock: 5.3,
      cache: 24,
      architecture: "Raptor Lake Refresh",
      pCores: 6,
      eCores: 8,
    },
  },

  "intel-core-i9-14900k": {
    image_url:
      "https://m.media-amazon.com/images/I/51gCKLZ3elL._AC_SL1500_.jpg",
    description:
      "Procesador insignia de 24 núcleos (8P+16E) con frecuencias de hasta 6.0 GHz, el más potente de Intel para plataforma LGA1700.",
    specs: {
      socket: "LGA1700",
      tdp: 125,
      hasIntegratedGraphics: false,
      includesCooler: false,
      cores: 24,
      threads: 32,
      baseClock: 3.2,
      boostClock: 6.0,
      cache: 36,
      architecture: "Raptor Lake Refresh",
      pCores: 8,
      eCores: 16,
    },
  },

  // =========================================================================
  // Motherboards (10)
  // =========================================================================

  "msi-mag-b550-tomahawk": {
    image_url:
      "https://storage-asset.msi.com/global/picture/product/product_16032747768bc6b0ca7fa64fc2c82b8f8fcde83bbc.png",
    description:
      "Placa madre ATX con chipset B550 para procesadores AMD AM4, con diseño térmico reforzado y conectividad robusta.",
    specs: {
      socket: "AM4",
      formFactor: "ATX",
      ramType: "ddr4",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 6,
      chipset: "B550",
      maxRamSpeed: 4866,
      usbPorts: { usb32Gen2: 1, usb32Gen1: 3, usb20: 2 },
      audioCodec: "Realtek ALC1200",
      lanChip: "Realtek RTL8125B 2.5G",
    },
  },

  "gigabyte-b450m-ds3h": {
    image_url:
      "https://static.gigabyte.com/StaticFile/Image/Global/46d18f10ac3d9419c1fc40b5e74ce2e0/Product/23530/png/1000",
    description:
      "Placa madre Micro-ATX económica con chipset B450, ideal para builds de presupuesto ajustado en plataforma AM4.",
    specs: {
      socket: "AM4",
      formFactor: "Micro-ATX",
      ramType: "ddr4",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "B450",
      maxRamSpeed: 3600,
      usbPorts: { usb32Gen1: 4, usb20: 4 },
      audioCodec: "Realtek ALC887",
      lanChip: "Realtek GbE",
    },
  },

  "asus-tuf-gaming-x570-plus": {
    image_url:
      "https://dlcdnwebimgs.asus.com/gain/21e8b3ce-1e19-4a6b-a4d4-df48f2a2db97/w800",
    description:
      "Placa madre ATX con chipset X570 de grado militar TUF, compatible con PCIe 4.0 y diseño térmico activo.",
    specs: {
      socket: "AM4",
      formFactor: "ATX",
      ramType: "ddr4",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "X570",
      maxRamSpeed: 4400,
      pcie4: true,
      usbPorts: { usb32Gen2: 1, usb32Gen1: 4, usb20: 2 },
      audioCodec: "Realtek S1200A",
      lanChip: "Realtek L8200A",
    },
  },

  "gigabyte-b650-aorus-elite-ax": {
    image_url:
      "https://static.gigabyte.com/StaticFile/Image/Global/0e0b8aa9ca1b0a6f405e1b109f3d0293/Product/30790/png/1000",
    description:
      "Placa madre ATX con chipset B650 para plataforma AM5, con WiFi 6E integrado y soporte completo para DDR5.",
    specs: {
      socket: "AM5",
      formFactor: "ATX",
      ramType: "ddr5",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "B650",
      maxRamSpeed: 6400,
      pcie4: true,
      wifi: "WiFi 6E",
      usbPorts: { usb32Gen2: 3, usb32Gen1: 1, usb20: 4 },
      audioCodec: "Realtek ALC897",
      lanChip: "Realtek 2.5GbE",
    },
  },

  "msi-pro-b650m-a-wifi": {
    image_url:
      "https://storage-asset.msi.com/global/picture/product/product_166341789489ef6b99d2df6099afd2f6a47e18c9fd.png",
    description:
      "Placa madre Micro-ATX con chipset B650, WiFi 6E y DDR5, opción compacta y accesible para plataforma AM5.",
    specs: {
      socket: "AM5",
      formFactor: "Micro-ATX",
      ramType: "ddr5",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "B650",
      maxRamSpeed: 6400,
      wifi: "WiFi 6E",
      usbPorts: { usb32Gen2: 1, usb32Gen1: 2, usb20: 4 },
      audioCodec: "Realtek ALC897",
      lanChip: "Realtek 2.5GbE",
    },
  },

  "asus-rog-strix-x670e-f-gaming-wifi": {
    image_url:
      "https://dlcdnwebimgs.asus.com/gain/da6a843c-b1c1-4bc1-8028-d0c0ba5c8ba2/w800",
    description:
      "Placa madre ATX premium con chipset X670E, PCIe 5.0 para GPU y M.2, WiFi 6E y VRM de 16+2 fases.",
    specs: {
      socket: "AM5",
      formFactor: "ATX",
      ramType: "ddr5",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "X670E",
      maxRamSpeed: 6400,
      pcie5: true,
      wifi: "WiFi 6E",
      usbPorts: { usb32Gen2x2: 1, usb32Gen2: 7, usb32Gen1: 4 },
      audioCodec: "ROG SupremeFX ALC4080",
      lanChip: "Intel 2.5GbE",
    },
  },

  "msi-pro-b760-p-wifi-ddr4": {
    image_url:
      "https://storage-asset.msi.com/global/picture/product/product_16699262106af4e4eab30f9e1dae6be54ca2dbaed4.png",
    description:
      "Placa madre ATX con chipset B760 para Intel LGA1700, compatible con DDR4 y WiFi integrado, ideal para upgrades económicos.",
    specs: {
      socket: "LGA1700",
      formFactor: "ATX",
      ramType: "ddr4",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "B760",
      maxRamSpeed: 4800,
      wifi: "WiFi 6",
      usbPorts: { usb32Gen2: 1, usb32Gen1: 2, usb20: 4 },
      audioCodec: "Realtek ALC897",
      lanChip: "Realtek 2.5GbE",
    },
  },

  "asus-prime-h610m-e-d4": {
    image_url:
      "https://dlcdnwebimgs.asus.com/gain/a22b9cc5-2cce-4f39-8faf-3c54e7f66cb9/w800",
    description:
      "Placa madre Micro-ATX de entrada con chipset H610 y DDR4, la opción más económica para Intel 12ª/13ª/14ª generación.",
    specs: {
      socket: "LGA1700",
      formFactor: "Micro-ATX",
      ramType: "ddr4",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "H610",
      maxRamSpeed: 4600,
      usbPorts: { usb32Gen1: 2, usb20: 4 },
      audioCodec: "Realtek ALC897",
      lanChip: "Realtek GbE",
    },
  },

  "gigabyte-z790-aorus-elite-ax": {
    image_url:
      "https://static.gigabyte.com/StaticFile/Image/Global/27c3b87b1c2f7e3c32f3b9e88f0a3f32/Product/30483/png/1000",
    description:
      "Placa madre ATX con chipset Z790, PCIe 5.0, WiFi 6E y VRM de alta gama para overclocking en plataforma Intel LGA1700.",
    specs: {
      socket: "LGA1700",
      formFactor: "ATX",
      ramType: "ddr4",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "Z790",
      maxRamSpeed: 5333,
      pcie5: true,
      wifi: "WiFi 6E",
      usbPorts: { usb32Gen2x2: 1, usb32Gen2: 5, usb32Gen1: 4 },
      audioCodec: "Realtek ALC1220-VB",
      lanChip: "Intel 2.5GbE",
    },
  },

  "msi-mag-z790-tomahawk-wifi": {
    image_url:
      "https://storage-asset.msi.com/global/picture/product/product_166699000016ab888d60c6cf4cf10eac67f6f95eaf.png",
    description:
      "Placa madre ATX con chipset Z790, diseño térmico reforzado, WiFi 6E y soporte PCIe 5.0 para builds de alto rendimiento Intel.",
    specs: {
      socket: "LGA1700",
      formFactor: "ATX",
      ramType: "ddr4",
      ramSlots: 4,
      m2Slots: 2,
      sataPorts: 4,
      chipset: "Z790",
      maxRamSpeed: 5200,
      pcie5: true,
      wifi: "WiFi 6E",
      usbPorts: { usb32Gen2x2: 1, usb32Gen2: 3, usb32Gen1: 4 },
      audioCodec: "Realtek ALC4080",
      lanChip: "Intel 2.5GbE",
    },
  },

  // =========================================================================
  // GPUs (5)
  // =========================================================================

  "msi-geforce-rtx-4060-ventus-2x": {
    image_url:
      "https://storage-asset.msi.com/global/picture/product/product_1689729049be0698e7a0dfe5ca158e7c0c4ccef54b.webp",
    description:
      "Tarjeta gráfica compacta de doble ventilador con 8 GB GDDR6 y eficiencia energética, ideal para gaming 1080p.",
    specs: {
      length: 240,
      slotWidth: 2,
      recommendedPsuWattage: 550,
      vram: 8,
      memoryType: "GDDR6",
      memoryBus: 128,
      baseClock: 1830,
      boostClock: 2460,
      tdp: 115,
      busInterface: "PCIe 4.0 x8",
      outputs: ["1x HDMI 2.1", "3x DisplayPort 1.4a"],
    },
  },

  "gigabyte-geforce-rtx-4070-super-windforce-oc": {
    image_url:
      "https://static.gigabyte.com/StaticFile/Image/Global/2e7b15aa74067ce64de478f18f96a3e6/Product/31897/png/1000",
    description:
      "Tarjeta gráfica de triple ventilador con 12 GB GDDR6X, rendimiento sólido para gaming 1440p y ray tracing.",
    specs: {
      length: 282,
      slotWidth: 2.5,
      recommendedPsuWattage: 650,
      vram: 12,
      memoryType: "GDDR6X",
      memoryBus: 192,
      baseClock: 1980,
      boostClock: 2550,
      tdp: 220,
      busInterface: "PCIe 4.0 x16",
      outputs: ["1x HDMI 2.1", "3x DisplayPort 1.4a"],
    },
  },

  "asus-tuf-gaming-geforce-rtx-4080-super": {
    image_url:
      "https://dlcdnwebimgs.asus.com/gain/4bc7d6c5-9bd9-48ae-b53c-7dbd22c8cf9d/w800",
    description:
      "Tarjeta gráfica de gama alta con 16 GB GDDR6X, diseño TUF de grado militar y triple ventilador para gaming 4K.",
    specs: {
      length: 348,
      slotWidth: 3.15,
      recommendedPsuWattage: 750,
      vram: 16,
      memoryType: "GDDR6X",
      memoryBus: 256,
      baseClock: 2295,
      boostClock: 2595,
      tdp: 320,
      busInterface: "PCIe 4.0 x16",
      outputs: ["2x HDMI 2.1", "3x DisplayPort 1.4a"],
    },
  },

  "sapphire-pulse-amd-radeon-rx-7600": {
    image_url:
      "https://m.media-amazon.com/images/I/51lFU-OPXFL._AC_SL1200_.jpg",
    description:
      "Tarjeta gráfica AMD RDNA 3 con 8 GB GDDR6, eficiente y compacta, excelente para gaming 1080p con FSR.",
    specs: {
      length: 241,
      slotWidth: 2,
      recommendedPsuWattage: 550,
      vram: 8,
      memoryType: "GDDR6",
      memoryBus: 128,
      baseClock: 1720,
      boostClock: 2655,
      tdp: 165,
      busInterface: "PCIe 4.0 x8",
      outputs: ["1x HDMI 2.1", "3x DisplayPort 2.1"],
    },
  },

  "xfx-speedster-qick-319-radeon-rx-7800-xt": {
    image_url:
      "https://m.media-amazon.com/images/I/51RIZBqL0-L._AC_SL1200_.jpg",
    description:
      "Tarjeta gráfica AMD RDNA 3 con 16 GB GDDR6 y triple ventilador, competidora directa para gaming 1440p de alto rendimiento.",
    specs: {
      length: 340,
      slotWidth: 2.5,
      recommendedPsuWattage: 700,
      vram: 16,
      memoryType: "GDDR6",
      memoryBus: 256,
      baseClock: 1295,
      boostClock: 2430,
      tdp: 263,
      busInterface: "PCIe 4.0 x16",
      outputs: ["1x HDMI 2.1", "3x DisplayPort 2.1"],
    },
  },

  // =========================================================================
  // RAM (5)
  // =========================================================================

  "corsair-vengeance-lpx-16gb-(2x8gb)-ddr4-3200mhz": {
    image_url:
      "https://m.media-amazon.com/images/I/51gOW0AQl2L._AC_SL1200_.jpg",
    description:
      "Kit de memoria DDR4 de 16 GB en doble canal con disipador de aluminio, opción confiable para builds AM4 y LGA1700.",
    specs: {
      ramType: "ddr4",
      modules: 2,
      capacityPerModule: 8,
      speed: 3200,
      latency: "CL16",
      voltage: 1.35,
      heatspreader: true,
    },
  },

  "kingston-fury-beast-32gb-(2x16gb)-ddr4-3200mhz": {
    image_url:
      "https://m.media-amazon.com/images/I/51IgAs6QMZL._AC_SL1500_.jpg",
    description:
      "Kit de memoria DDR4 de 32 GB en doble canal, ideal para gaming y multitarea exigente en plataformas con DDR4.",
    specs: {
      ramType: "ddr4",
      modules: 2,
      capacityPerModule: 16,
      speed: 3200,
      latency: "CL16",
      voltage: 1.35,
      heatspreader: true,
    },
  },

  "g.skill-trident-z5-rgb-32gb-(2x16gb)-ddr5-6000mhz": {
    image_url:
      "https://m.media-amazon.com/images/I/51QdaiqKqWL._AC_SL1500_.jpg",
    description:
      "Kit DDR5 de alto rendimiento con iluminación RGB y perfil bajo, optimizado para Intel XMP y AMD EXPO.",
    specs: {
      ramType: "ddr5",
      modules: 2,
      capacityPerModule: 16,
      speed: 6000,
      latency: "CL30",
      voltage: 1.35,
      heatspreader: true,
      rgb: true,
    },
  },

  "corsair-vengeance-32gb-(2x16gb)-ddr5-5600mhz": {
    image_url:
      "https://m.media-amazon.com/images/I/41dS+KMHYML._AC_SL1200_.jpg",
    description:
      "Kit DDR5 de perfil bajo y diseño elegante, compatible con AMD EXPO e Intel XMP 3.0 para plataformas de nueva generación.",
    specs: {
      ramType: "ddr5",
      modules: 2,
      capacityPerModule: 16,
      speed: 5600,
      latency: "CL36",
      voltage: 1.25,
      heatspreader: true,
    },
  },

  "teamgroup-t-force-delta-rgb-32gb-(2x16gb)-ddr5-6000mhz": {
    image_url:
      "https://m.media-amazon.com/images/I/51+I6MDPF2L._AC_SL1500_.jpg",
    description:
      "Kit DDR5 con iluminación RGB de barra completa y alto rendimiento, soporta Intel XMP 3.0 y AMD EXPO.",
    specs: {
      ramType: "ddr5",
      modules: 2,
      capacityPerModule: 16,
      speed: 6000,
      latency: "CL30",
      voltage: 1.35,
      heatspreader: true,
      rgb: true,
    },
  },

  // =========================================================================
  // PSUs (5)
  // =========================================================================

  "corsair-rm750e": {
    image_url:
      "https://m.media-amazon.com/images/I/51+8fiwNrQL._AC_SL1200_.jpg",
    description:
      "Fuente de poder modular de 750W con certificación 80+ Gold, ventilador silencioso con modo Zero RPM.",
    specs: {
      wattage: 750,
      formFactor: "atx",
      certification: "80+ Gold",
      modular: "fully",
      fanSize: 120,
      protections: ["OVP", "UVP", "SCP", "OPP", "OTP"],
    },
  },

  "evga-600-w1": {
    image_url:
      "https://m.media-amazon.com/images/I/51AX69IpfZL._AC_SL1200_.jpg",
    description:
      "Fuente de poder de 600W con certificación 80+ White, opción económica para builds de entrada.",
    specs: {
      wattage: 600,
      formFactor: "atx",
      certification: "80+ White",
      modular: "no",
      fanSize: 120,
      protections: ["OVP", "UVP", "SCP", "OPP"],
    },
  },

  "seasonic-focus-gx-850": {
    image_url:
      "https://m.media-amazon.com/images/I/51c-cGEQIqL._AC_SL1200_.jpg",
    description:
      "Fuente de poder modular de 850W con certificación 80+ Gold, calidad premium Seasonic con 10 años de garantía.",
    specs: {
      wattage: 850,
      formFactor: "atx",
      certification: "80+ Gold",
      modular: "fully",
      fanSize: 120,
      protections: ["OVP", "UVP", "SCP", "OPP", "OTP", "OCP"],
    },
  },

  "asus-rog-thor-1000w-platinum-ii": {
    image_url:
      "https://dlcdnwebimgs.asus.com/gain/4c79c22e-b8c5-4f13-8fe6-2f0ff69ed45f/w800",
    description:
      "Fuente de poder premium de 1000W con certificación 80+ Platinum, pantalla OLED integrada y diseño ROG.",
    specs: {
      wattage: 1000,
      formFactor: "atx",
      certification: "80+ Platinum",
      modular: "fully",
      fanSize: 135,
      protections: ["OVP", "UVP", "SCP", "OPP", "OTP", "OCP"],
      oledDisplay: true,
    },
  },

  "gigabyte-p650b": {
    image_url:
      "https://m.media-amazon.com/images/I/51hVu2KBPIL._AC_SL1200_.jpg",
    description:
      "Fuente de poder de 650W con certificación 80+ Bronze, opción confiable y económica para builds de gama media.",
    specs: {
      wattage: 650,
      formFactor: "atx",
      certification: "80+ Bronze",
      modular: "no",
      fanSize: 120,
      protections: ["OVP", "UVP", "SCP", "OPP"],
    },
  },

  // =========================================================================
  // Storage (5)
  // =========================================================================

  "kingston-nv2-1tb": {
    image_url:
      "https://m.media-amazon.com/images/I/41kGadRbVdL._AC_SL1200_.jpg",
    description:
      "SSD NVMe M.2 de 1 TB con interfaz PCIe 4.0, velocidades de lectura de hasta 3500 MB/s para arranque y carga rápida.",
    specs: {
      type: "nvme",
      formFactor: "m.2 2280",
      capacity: 1000,
      readSpeed: 3500,
      writeSpeed: 2100,
      interface: "PCIe 4.0 x4",
      endurance: 320,
    },
  },

  "samsung-980-pro-1tb": {
    image_url:
      "https://m.media-amazon.com/images/I/31sINJKkB8L._AC_SL1280_.jpg",
    description:
      "SSD NVMe M.2 de alto rendimiento con controlador Elpis de Samsung, velocidades de hasta 7000 MB/s en lectura.",
    specs: {
      type: "nvme",
      formFactor: "m.2 2280",
      capacity: 1000,
      readSpeed: 7000,
      writeSpeed: 5000,
      interface: "PCIe 4.0 x4",
      endurance: 600,
      cache: "1GB LPDDR4",
    },
  },

  "wd-black-sn850x-2tb": {
    image_url:
      "https://m.media-amazon.com/images/I/31gCasmgzyL._AC_SL1280_.jpg",
    description:
      "SSD NVMe M.2 de 2 TB optimizado para gaming, con velocidades de lectura de hasta 7300 MB/s y gran capacidad.",
    specs: {
      type: "nvme",
      formFactor: "m.2 2280",
      capacity: 2000,
      readSpeed: 7300,
      writeSpeed: 6600,
      interface: "PCIe 4.0 x4",
      endurance: 1200,
      cache: "2GB DDR4",
    },
  },

  "crucial-bx500-1tb": {
    image_url:
      "https://m.media-amazon.com/images/I/51MnIQ+JSEL._AC_SL1500_.jpg",
    description:
      "SSD SATA de 1 TB en formato 2.5\", opción económica para reemplazar discos duros mecánicos con mejora inmediata.",
    specs: {
      type: "sata",
      formFactor: "2.5",
      capacity: 1000,
      readSpeed: 540,
      writeSpeed: 500,
      interface: "SATA III 6Gb/s",
      endurance: 360,
    },
  },

  "seagate-barracuda-2tb": {
    image_url:
      "https://m.media-amazon.com/images/I/51kfMz6fwBL._AC_SL1500_.jpg",
    description:
      "Disco duro mecánico de 2 TB a 7200 RPM, almacenamiento masivo económico para archivos, juegos y backups.",
    specs: {
      type: "sata",
      formFactor: "2.5",
      capacity: 2000,
      readSpeed: 220,
      writeSpeed: 220,
      interface: "SATA III 6Gb/s",
      rpm: 7200,
      cache: "256MB",
    },
  },
};

// ---------------------------------------------------------------------------
// Main routine
// ---------------------------------------------------------------------------

async function enrichCatalog() {
  const slugs = Object.keys(enrichmentData);
  let updated = 0;
  let failed = 0;

  console.log(`\n🚀 Enriqueciendo ${slugs.length} productos en Supabase...\n`);

  for (const slug of slugs) {
    const data = enrichmentData[slug];

    const { error } = await supabase
      .from("products")
      .update({
        image_url: data.image_url,
        description: data.description,
        specs: data.specs,
      })
      .eq("slug", slug);

    if (error) {
      console.error(`  ❌ ${slug}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✅ ${slug}`);
      updated++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📦 Actualizados: ${updated}/${slugs.length}`);
  if (failed > 0) {
    console.log(`❌ Fallidos:     ${failed}`);
  }
  console.log(`${"=".repeat(60)}\n`);

  // Verify by reading back
  const { data: verifyData, error: verifyError } = await supabase
    .from("products")
    .select("slug, image_url, description")
    .not("image_url", "is", null);

  if (verifyError) {
    console.error("❌ Error en verificación:", verifyError.message);
  } else {
    console.log(
      `🔍 Verificación: ${verifyData?.length || 0} productos tienen image_url poblado.`
    );

    const missing = verifyData?.filter((p) => !p.description) || [];
    if (missing.length > 0) {
      console.log(`⚠️  ${missing.length} productos sin descripción.`);
    }
  }
}

enrichCatalog().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
