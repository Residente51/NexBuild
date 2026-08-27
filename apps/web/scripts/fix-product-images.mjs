/**
 * Fix Product Images Script
 *
 * Reemplaza los enlaces con bloqueo de hotlinking por rutas relativas locales
 * con el formato /images/components/[slug].png
 *
 * Usage:
 *   node apps/web/scripts/fix-product-images.mjs
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    const localUrl = `/images/components/${product.slug}.png`;
    
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
