import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Asegurar que se carguen las variables de entorno desde apps/web/.env.local
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
    // Usamos cabeceras estrictas de navegador para evadir WAFs y protecciones anti-hotlink (403)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/',
        'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType
    };
  } catch (error) {
    console.error(`⚠️ Error al descargar la imagen desde ${url.substring(0, 60)}...:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando migración de imágenes a la CDN de Supabase...');

  // 1. Consultar productos
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('*');

  if (fetchError) {
    console.error('❌ Error al obtener los productos:', fetchError);
    return;
  }

  console.log(`📦 Se encontraron ${products.length} productos en la base de datos.`);

  for (const product of products) {
    const name = product.name || 'Componente desconocido';
    const currentUrl = product.image_url;

    console.log(`\n🔄 Procesando: ${name}`);

    if (!currentUrl) {
      console.log(`⚠️ No hay URL de imagen para este producto. Saltando.`);
      continue;
    }

    // Saltar si la imagen ya fue migrada a Supabase Storage
    if (currentUrl.includes('supabase.co')) {
      console.log(`✅ La imagen ya está alojada en Supabase Storage. Saltando.`);
      continue;
    }

    console.log(`⬇️ Intentando descargar imagen original: ${currentUrl.substring(0, 80)}...`);
    
    // 2. Descargar imagen con headers anti-WAF
    const imageData = await downloadImage(currentUrl);
    
    if (!imageData) {
      console.log(`❌ Falló la descarga de la imagen para ${name}.`);
      continue;
    }

    const slug = product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Intentar deducir la extensión por el Content-Type o la URL
    let extension = 'png';
    if (imageData.contentType.includes('jpeg') || imageData.contentType.includes('jpg')) extension = 'jpg';
    else if (imageData.contentType.includes('webp')) extension = 'webp';
    else if (imageData.contentType.includes('gif')) extension = 'gif';
    else if (currentUrl.toLowerCase().endsWith('.jpg')) extension = 'jpg';
    else if (currentUrl.toLowerCase().endsWith('.png')) extension = 'png';
    
    const fileName = `${slug}.${extension}`;

    // 3. Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('components')
      .upload(fileName, imageData.buffer, {
        upsert: true,
        contentType: imageData.contentType
      });

    if (uploadError) {
      console.error(`❌ Error al subir ${fileName} a Storage:`, uploadError.message);
      continue;
    }

    // Obtener la URL pública oficial de la CDN de Supabase
    const { data: publicUrlData } = supabase.storage
      .from('components')
      .getPublicUrl(fileName);
    
    const publicUrl = publicUrlData.publicUrl;
    console.log(`☁️ Subida exitosa a la CDN: ${publicUrl}`);

    // 4. Actualizar la tabla de productos
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', product.id);

    if (updateError) {
      console.error(`❌ Error al actualizar DB para ${name}:`, updateError.message);
    } else {
      console.log(`💾 Columna image_url actualizada correctamente en la base de datos.`);
    }

    // ⏳ Pausa de cortesía (800ms) para no disparar rate-limits de las tiendas de origen
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log('\n🎉 ¡Migración de imágenes a la nube completada exitosamente!');
}

main().catch(console.error);
