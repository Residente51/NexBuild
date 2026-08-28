import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde apps/web/.env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY). Revisa apps/web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function downloadImage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`⚠️ Error al descargar la imagen: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando script auto-fix-cloud-images con Puppeteer...');

  // 1. Obtener productos de Supabase
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*');

  if (fetchError) {
    console.error('❌ Error al obtener productos:', fetchError);
    return;
  }

  console.log(`📦 Se encontraron ${products.length} productos. Iniciando Puppeteer...`);

  // 2. Iniciar Puppeteer
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Configurar User Agent para evadir bloqueos
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  for (const product of products) {
    const brand = product.brand || '';
    const name = product.name || '';
    const query = `${brand} ${name} pc component png`;
    
    console.log(`\n🔄 Procesando: ${name}`);
    console.log(`🔍 Búsqueda: ${query}`);

    try {
      // 3. Navegar a DuckDuckGo Images
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

      // Esperar activamente al elemento en lugar de un setTimeout ciego
      await page.waitForSelector('.tile--img__img', { timeout: 15000 }).catch(() => null);

      // 4. Extraer la primera imagen válida
      const imageUrl = await page.evaluate(() => {
        const img = document.querySelector('.tile--img__img');
        if (!img) return null;
        return img.getAttribute('src') || img.getAttribute('data-src');
      });

      if (!imageUrl) {
        console.log(`⚠️ No se encontró ninguna imagen válida para ${name}`);
        continue;
      }
      
      let finalUrl = imageUrl;
      if (imageUrl.startsWith('//')) finalUrl = `https:${imageUrl}`;
      else if (imageUrl.startsWith('/')) finalUrl = `https://duckduckgo.com${imageUrl}`;

      console.log(`✅ Imagen encontrada: ${finalUrl.substring(0, 50)}...`);

      // 5. Descargar imagen a Buffer
      const imageBuffer = await downloadImage(finalUrl);
      if (!imageBuffer) continue;

      // 6. Subir a Supabase Storage (Bucket: components)
      const slug = product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const fileName = `${slug}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('components')
        .upload(fileName, imageBuffer, {
          upsert: true,
          contentType: 'image/png'
        });

      if (uploadError) {
        console.error(`❌ Error al subir ${fileName} a Storage:`, uploadError.message);
        continue;
      }

      // Obtener la URL pública que genera Supabase
      const { data: publicUrlData } = supabase.storage
        .from('components')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;
      console.log(`☁️ Subida a Supabase exitosa: ${publicUrl}`);

      // 7. Actualizar la columna image_url en la tabla products
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error al actualizar la base de datos para ${name}:`, updateError.message);
      } else {
        console.log(`💾 Base de datos actualizada con la nueva imagen de Supabase.`);
      }

    } catch (err) {
      console.error(`❌ Excepción al procesar ${name}:`, err.message);
    }
    
    // ⏳ Pausa para evitar rate-limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();
  console.log('\n🎉 ¡Proceso de automatización de imágenes completado!');
}

main().catch(console.error);
