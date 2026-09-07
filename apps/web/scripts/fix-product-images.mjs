/**
 * Fix Product Images Script
 *
 * Reemplaza enlaces externos por una imagen local existente. Nunca escribe una
 * ruta a un archivo ausente y respeta la extensión real del asset.
 *
 * Usage:
 *   node apps/web/scripts/fix-product-images.mjs
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const imagesDirectory = resolve(__dirname, "../public/images/components");
const supportedExtensions = ["png", "svg", "webp", "jpg", "jpeg"];

async function fixImages() {
  console.log("🚀 Obteniendo catálogo de Supabase...");
  
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, slug, name");

  if (fetchError) {
    console.error("❌ Error obteniendo productos:", fetchError.message);
    process.exit(1);
  }

  console.log(`📦 Encontrados ${products.length} productos. Actualizando imágenes a rutas locales...`);
  
  let updated = 0;
  let failed = 0;

  for (const product of products) {
    if (!/^[a-z0-9.()-]+$/i.test(product.slug)) {
      console.warn(`  ⚠️ Slug no seguro: ${product.slug}; fila omitida.`);
      continue;
    }
    const extension = supportedExtensions.find((candidate) =>
      existsSync(resolve(imagesDirectory, `${product.slug}.${candidate}`)),
    );
    if (!extension) {
      console.warn(`  ⚠️ Sin asset local para ${product.slug}; se conserva la URL actual.`);
      continue;
    }
    const localUrl = `/images/components/${product.slug}.${extension}`;
    
    const { error: updateError } = await supabase
      .from("products")
      .update({ image_url: localUrl })
      .eq("id", product.id);

    if (updateError) {
      console.error(`  ❌ Error en ${product.slug}:`, updateError.message);
      failed++;
    } else {
      updated++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Filas actualizadas: ${updated}`);
  if (failed > 0) console.log(`❌ Filas fallidas: ${failed}`);
  console.log(`${"=".repeat(50)}\n`);
}

fixImages().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
