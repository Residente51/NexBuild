/**
 * Materializa imágenes verificadas dentro de los SVG locales que ya referencia
 * el catálogo. No consulta ni modifica Supabase.
 *
 * Uso:
 *   node scripts/download-component-images.mjs          # auditoría
 *   node scripts/download-component-images.mjs --write  # escribe assets locales
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { catalogImageSources } from "./catalog-image-sources.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const imagesDirectory = resolve(scriptDirectory, "../public/images/components");
const maximumBytes = 5 * 1024 * 1024;
const requestTimeoutMs = 15_000;
const allowedImageHosts = new Set([
  "cdn.ibertronica.es",
  "cdn.shopify.com",
  "ecommerce.datablitz.com.ph",
  "neocomputer.md",
]);

export function detectRasterMime(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return "image/png";
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "image/webp";
  return null;
}

export function createEmbeddedSvg(buffer, mime, sourceUrl) {
  const encodedSource = sourceUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img">
  <metadata>Source: ${encodedSource}</metadata>
  <rect width="1000" height="1000" fill="#f7f7f7"/>
  <image href="data:${mime};base64,${buffer.toString("base64")}" x="24" y="24" width="952" height="952" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

async function downloadImage(imageUrl) {
  const parsedUrl = new URL(imageUrl);
  if (parsedUrl.protocol !== "https:" || !allowedImageHosts.has(parsedUrl.hostname)) {
    throw new Error(`Host de imagen no permitido: ${parsedUrl.hostname}`);
  }

  const response = await fetch(parsedUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: { "User-Agent": "NexBuild catalog image materializer/1.0" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > maximumBytes) throw new Error("La imagen supera 5 MB");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maximumBytes) throw new Error("La imagen supera 5 MB");

  const mime = detectRasterMime(buffer);
  if (!mime) throw new Error("El contenido remoto no es una imagen raster válida");
  return { buffer, mime };
}

async function materializeImages({ write }) {
  if (write) await mkdir(imagesDirectory, { recursive: true });

  let succeeded = 0;
  for (const [slug, source] of Object.entries(catalogImageSources)) {
    try {
      const { buffer, mime } = await downloadImage(source.imageUrl);
      const outputPath = resolve(imagesDirectory, `${slug}.svg`);
      const svg = createEmbeddedSvg(buffer, mime, source.imageUrl);

      if (write) {
        await writeFile(outputPath, svg, "utf8");
        console.log(`OK ${slug}: ${mime}, ${buffer.length} bytes`);
      } else {
        const current = await readFile(outputPath, "utf8").catch(() => "");
        const state = current.includes("data:image/") ? "materializada" : "pendiente";
        console.log(`CHECK ${slug}: ${mime}, ${buffer.length} bytes, ${state}`);
      }
      succeeded += 1;
    } catch (error) {
      console.error(`ERROR ${slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(`${write ? "Escritas" : "Verificadas"}: ${succeeded}/${Object.keys(catalogImageSources).length}`);
  if (succeeded !== Object.keys(catalogImageSources).length) process.exitCode = 1;
}

const isDirectExecution = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isDirectExecution) {
  await materializeImages({ write: process.argv.includes("--write") });
}
