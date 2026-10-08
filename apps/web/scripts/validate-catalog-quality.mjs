import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const payloadUrl = new URL("./catalog-quality-v1.json", import.meta.url);
const allowedUpdateFields = new Set(["image_url", "description"]);
const allowedImageHosts = new Set([
  "www.coolermaster.com",
  "dlcdnwebimgs.asus.com",
  "www.asus.com",
]);

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

function validateUpdate(entry) {
  const errors = [];
  if (!isNonEmptyString(entry?.id)) errors.push("id ausente");
  if (!isNonEmptyString(entry?.slug)) errors.push("slug ausente");
  if (!isNonEmptyString(entry?.expectedName)) errors.push("nombre esperado ausente");
  if (!entry?.expectedCurrent || typeof entry.expectedCurrent !== "object") {
    errors.push("estado esperado ausente");
  }
  if (!entry?.update || typeof entry.update !== "object") {
    errors.push("UPDATE ausente");
    return errors;
  }

  const fields = Object.keys(entry.update);
  if (fields.length === 0 || fields.some((field) => !allowedUpdateFields.has(field))) {
    errors.push("campos de UPDATE no permitidos");
  }
  if (!isHttpsUrl(entry.update.image_url)) {
    errors.push("image_url debe ser HTTPS");
  } else if (!allowedImageHosts.has(new URL(entry.update.image_url).hostname)) {
    errors.push("host de imagen no permitido");
  }
  if (
    "description" in entry.update &&
    (!isNonEmptyString(entry.update.description) || entry.update.description.length > 300)
  ) {
    errors.push("description debe contener entre 1 y 300 caracteres");
  }
  if (!isHttpsUrl(entry.sources?.productPage) || !isHttpsUrl(entry.sources?.imageAsset)) {
    errors.push("fuentes HTTPS inválidas");
  }
  if (entry.sources?.imageAsset !== entry.update.image_url) {
    errors.push("imageAsset no coincide con image_url");
  }
  return errors;
}

async function verifyImage(url) {
  let response = await fetch(url, { method: "HEAD", redirect: "follow" });
  if (response.status === 405) {
    response = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    });
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
    throw new Error(`imagen no disponible (${response.status}, ${contentType || "sin content-type"})`);
  }
}

async function createSupabaseClient() {
  const [{ createClient }, dotenv] = await Promise.all([
    import("@supabase/supabase-js"),
    import("dotenv"),
  ]);
  dotenv.config({ path: resolve(__dirname, "../.env.local"), quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta configuración local de Supabase");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function preflightProduction(supabase, updates) {
  const slugs = updates.map((entry) => entry.slug);
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, image_url, description")
    .in("slug", slugs);
  if (error) throw error;
  if (data.length !== updates.length) {
    throw new Error(`Se esperaban ${updates.length} filas y Supabase devolvió ${data.length}`);
  }

  const bySlug = new Map(data.map((row) => [row.slug, row]));
  for (const entry of updates) {
    const row = bySlug.get(entry.slug);
    if (!row || row.id !== entry.id || row.name !== entry.expectedName) {
      throw new Error(`${entry.slug}: identidad de producto inesperada`);
    }
    for (const [field, expected] of Object.entries(entry.expectedCurrent)) {
      if (row[field] !== expected) {
        throw new Error(`${entry.slug}: ${field} cambió desde la preparación del payload`);
      }
    }
  }
}

async function applyUpdates(supabase, updates) {
  for (const entry of updates) {
    const { data, error } = await supabase
      .from("products")
      .update(entry.update)
      .eq("id", entry.id)
      .eq("slug", entry.slug)
      .select("id, slug, image_url, description");
    if (error) throw error;
    if (data.length !== 1) throw new Error(`${entry.slug}: UPDATE no afectó exactamente una fila`);
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, slug, image_url, description")
    .in("slug", updates.map((entry) => entry.slug));
  if (error) throw error;
  const bySlug = new Map(data.map((row) => [row.slug, row]));
  for (const entry of updates) {
    const row = bySlug.get(entry.slug);
    for (const [field, expected] of Object.entries(entry.update)) {
      if (row?.[field] !== expected) throw new Error(`${entry.slug}: read-back incorrecto en ${field}`);
    }
  }
}

const payload = JSON.parse(await readFile(payloadUrl, "utf8"));
const updates = payload.updates ?? [];
const errors = [];
const ids = new Set();
const slugs = new Set();

for (const entry of updates) {
  for (const error of validateUpdate(entry)) errors.push(`${entry?.slug ?? "(sin slug)"}: ${error}`);
  if (ids.has(entry.id)) errors.push(`${entry.slug}: id duplicado`);
  if (slugs.has(entry.slug)) errors.push(`${entry.slug}: slug duplicado`);
  ids.add(entry.id);
  slugs.add(entry.slug);
}

if (updates.length !== 11) errors.push(`se esperaban 11 productos objetivo y hay ${updates.length}`);
if (updates.filter((entry) => "description" in entry.update).length !== 6) {
  errors.push("se esperaban 6 descripciones nuevas");
}

if (errors.length > 0) {
  console.error("Payload inválido:\n- " + errors.join("\n- "));
  process.exitCode = 1;
} else {
  console.log(`Dry-run válido: ${updates.length} UPDATE planeados.`);
  for (const entry of updates) {
    console.log(`UPDATE products: ${entry.slug} (${Object.keys(entry.update).join(", ")}).`);
  }
  if (!process.argv.includes("--apply")) {
    console.log("No se ejecutó ninguna escritura.");
  }
}

if (process.exitCode !== 1 && process.argv.includes("--verify-images")) {
  for (const entry of updates) {
    await verifyImage(entry.update.image_url);
    console.log(`Imagen verificada: ${entry.slug}`);
  }
}

if (process.exitCode !== 1 && process.argv.includes("--apply")) {
  if (!process.argv.includes("--confirm=catalog-quality-v1")) {
    throw new Error("La aplicación requiere --confirm=catalog-quality-v1");
  }
  const supabase = await createSupabaseClient();
  await preflightProduction(supabase, updates);
  await applyUpdates(supabase, updates);
  console.log(`Aplicación y read-back completos: ${updates.length} filas actualizadas.`);
}

export { allowedImageHosts, validateUpdate };
