import { readFile } from "node:fs/promises";

const payloadUrl = new URL("./catalog-expansion-v1.json", import.meta.url);
const validCategories = new Set(["case", "cooler"]);
const isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

function validateCase(specs) {
  return (
    Array.isArray(specs.supportedMotherboards) && specs.supportedMotherboards.every(isNonEmptyString) &&
    isPositiveInteger(specs.maxGpuLength) &&
    isPositiveInteger(specs.maxCoolerHeight) &&
    Array.isArray(specs.supportedPsuFormFactors) && specs.supportedPsuFormFactors.every(isNonEmptyString) &&
    Array.isArray(specs.radiatorSupport) && specs.radiatorSupport.every(isNonEmptyString)
  );
}

function validateCooler(specs) {
  return (
    specs.type === "air" &&
    Array.isArray(specs.supportedSockets) && specs.supportedSockets.every(isNonEmptyString) &&
    isPositiveInteger(specs.height)
  );
}

function validateProduct(product) {
  if (!isNonEmptyString(product.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) {
    return "slug inválido";
  }
  if (!isNonEmptyString(product.name) || !isNonEmptyString(product.brand) || !validCategories.has(product.category)) {
    return "campos base inválidos";
  }
  if (product.category === "case" && !validateCase(product.specs)) return "specs de gabinete inválidas";
  if (product.category === "cooler" && !validateCooler(product.specs)) return "specs de cooler inválidas";
  if (!isNonEmptyString(product.listing?.storeId) || !isPositiveInteger(product.listing?.priceCash) || product.listing?.inStock !== true || !isHttpsUrl(product.listing?.productUrl)) {
    return "listing inválido";
  }
  if (!isHttpsUrl(product.sources?.specs) || !isHttpsUrl(product.sources?.listing)) return "fuentes inválidas";
  return null;
}

const payload = JSON.parse(await readFile(payloadUrl, "utf8"));
const errors = [];
const slugs = new Set();
const categories = new Map();

for (const product of payload.products ?? []) {
  const error = validateProduct(product);
  if (error) errors.push(`${product?.slug ?? "(sin slug)"}: ${error}`);
  if (slugs.has(product?.slug)) errors.push(`${product.slug}: slug duplicado`);
  slugs.add(product?.slug);
  categories.set(product?.category, (categories.get(product?.category) ?? 0) + 1);
}

for (const category of validCategories) {
  if ((categories.get(category) ?? 0) < 3) errors.push(`${category}: se requieren al menos tres opciones`);
}

if (errors.length > 0) {
  console.error("Payload inválido:\n- " + errors.join("\n- "));
  process.exitCode = 1;
} else {
  console.log(`Dry-run válido: ${payload.products.length} INSERT en products y ${payload.products.length} INSERT en store_listings.`);
  for (const product of payload.products) {
    console.log(`INSERT products: ${product.slug} (${product.category}); INSERT store_listings: ${product.listing.storeId}, $${product.listing.priceCash}.`);
  }
  console.log("No se conectó a Supabase y no se ejecutó ninguna escritura.");
}

export { validateProduct };

if (process.argv.includes("--apply")) {
  console.error("Este validador no ejecuta escrituras. La aplicación a producción requiere una revisión y autorización separadas.");
  process.exitCode = 1;
}
