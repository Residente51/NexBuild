import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';

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
const imagesDir = resolve(__dirname, '../public/images/components');

// 1. Asegúrate de crear el directorio si no existe
if (!fs.existsSync(imagesDir)) {
  console.log(`📁 Creando directorio local: ${imagesDir}`);
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generador de SVG vectorial minimalista para respaldos
function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function generateFallbackSvg(brand, category, name) {
  const brandText = escapeXml(brand || 'NEXBUILD');
  const catText = escapeXml(category ? category.toUpperCase() : 'COMPONENTE');
  const nameText = escapeXml(name || '');
  
  // Paleta iOS: Fondo oscuro #191923, acentos azules #0E79B2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#191923" />
      <stop offset="100%" stop-color="#14141e" />
    </linearGradient>
    <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E79B2" />
      <stop offset="100%" stop-color="#095d8a" />
    </linearGradient>
  </defs>
  
  <!-- Fondo iOS Dark -->
  <rect width="100%" height="100%" fill="url(#bg-grad)"/>
  
  <!-- Borde decorativo azul minimalista -->
  <rect x="40" y="40" width="720" height="520" fill="none" stroke="url(#accent-grad)" stroke-width="2" rx="24" stroke-opacity="0.5"/>
  
  <!-- Ícono minimalista de chip/hardware -->
  <rect x="350" y="160" width="100" height="100" fill="none" stroke="#0E79B2" stroke-width="4" rx="16"/>
  <rect x="375" y="185" width="50" height="50" fill="#0E79B2" rx="8" opacity="0.9"/>
  <!-- Conectores del chip -->
  <line x1="330" y1="185" x2="350" y2="185" stroke="#0E79B2" stroke-width="4"/>
  <line x1="330" y1="210" x2="350" y2="210" stroke="#0E79B2" stroke-width="4"/>
  <line x1="330" y1="235" x2="350" y2="235" stroke="#0E79B2" stroke-width="4"/>
  <line x1="450" y1="185" x2="470" y2="185" stroke="#0E79B2" stroke-width="4"/>
  <line x1="450" y1="210" x2="470" y2="210" stroke="#0E79B2" stroke-width="4"/>
  <line x1="450" y1="235" x2="470" y2="235" stroke="#0E79B2" stroke-width="4"/>

  <!-- Textos tipográficos -->
  <text x="400" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">${brandText}</text>
  <text x="400" y="390" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="600" fill="#0E79B2" text-anchor="middle" letter-spacing="5">${catText}</text>
  <text x="400" y="440" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="400" fill="#8E8E93" text-anchor="middle">${nameText}</text>
</svg>`;
}

// Magic bytes signatures for image formats
const MAGIC_BYTES = {
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  webp: Buffer.from([0x52, 0x49, 0x46, 0x46]),
  gif: Buffer.from([0x47, 0x49, 0x46]),
};

const SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const TIMEOUT_MS = 8000; // 8 seconds

function detectImageExtension(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // Check PNG
  if (buffer.slice(0, 4).equals(MAGIC_BYTES.png)) return 'png';

  // Check JPEG
  if (buffer.slice(0, 3).equals(MAGIC_BYTES.jpeg)) return 'jpg';

  // Check WebP (RIFF...WEBP)
  if (buffer.slice(0, 4).equals(MAGIC_BYTES.webp) &&
      buffer.slice(8, 12).toString() === 'WEBP') return 'webp';

  // Check GIF
  if (buffer.slice(0, 3).equals(MAGIC_BYTES.gif)) return 'gif';

  // Reject HTML/XML/text
  const textStart = buffer.slice(0, 10).toString('utf8').toLowerCase();
  if (textStart.includes('<!') || textStart.includes('<?')) return null;

  return null;
}

async function downloadImage(url) {
  try {
    // 1. Restrict to HTTPS only
    if (!url.startsWith('https://')) {
      throw new Error('Only HTTPS URLs are allowed');
    }

    // 2. Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // 3. Fetch with strict headers and size validation
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 4. Validate Content-Length header
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > SIZE_LIMIT) {
      throw new Error(`File exceeds 5MB limit (${contentLength} bytes)`);
    }

    // 5. Read buffer and validate size
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > SIZE_LIMIT) {
      throw new Error(`Downloaded file exceeds 5MB limit (${buffer.length} bytes)`);
    }

    // 6. Validate magic bytes (cryptographic file signature)
    const extension = detectImageExtension(buffer);
    if (!extension) {
      throw new Error('Invalid image format detected (magic bytes validation failed)');
    }

    return { buffer, extension };
  } catch (error) {
    const errorMsg = error.name === 'AbortError'
      ? 'Download timeout (>8s)'
      : error.message;
    console.error(`⚠️ Error al descargar ${url.substring(0, 60)}...: ${errorMsg}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando población de imágenes en carpeta local public/images/components...');

  // 2. Consultar los 40 productos
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
    const slug = product.slug;
    if (!slug || !/^[a-z0-9.()-]+$/i.test(slug)) {
      console.warn(`⚠️ Slug no seguro para ${name}; producto omitido.`);
      continue;
    }
    const currentUrl = product.image_url;
    let localRelativeUrl = '';

    console.log(`\n🔄 Procesando: ${name}`);

    let downloadedImage = null;
    
    // Si la URL actual es válida y externa, intentamos descargarla
    if (currentUrl && currentUrl.startsWith('http')) {
      console.log(`⬇️ Intentando descargar: ${currentUrl.substring(0, 70)}...`);
      downloadedImage = await downloadImage(currentUrl);
    } else {
      console.log(`⚠️ La URL actual no es válida para descarga HTTP: ${currentUrl}`);
    }

    // 4 & 5. Guardar PNG válido o generar SVG de respaldo
    if (downloadedImage) {
      const localPath = join(imagesDir, `${slug}.${downloadedImage.extension}`);
      localRelativeUrl = `/images/components/${slug}.${downloadedImage.extension}`;
      fs.writeFileSync(localPath, downloadedImage.buffer);
      console.log(`✅ Imagen descargada con éxito y guardada como ${slug}.png`);
    } else {
      console.log(`🛡️ Generando SVG vectorial de respaldo para ${slug}...`);
      const svgContent = generateFallbackSvg(product.brand, product.category, product.name);
      
      // Guardamos la imagen de respaldo generada
      const localPath = join(imagesDir, `${slug}.svg`);
      localRelativeUrl = `/images/components/${slug}.svg`;
      fs.writeFileSync(localPath, svgContent);
      console.log(`🎨 SVG minimalista generado exitosamente.`);
    }

    // 6. Actualizar la base de datos con la ruta local
    if (product.image_url !== localRelativeUrl) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: localRelativeUrl })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error al actualizar DB para ${name}:`, updateError.message);
      } else {
        console.log(`💾 Supabase actualizado -> ${localRelativeUrl}`);
      }
    } else {
      console.log(`⏭️ La base de datos ya apunta a ${localRelativeUrl}`);
    }

    // Pausa de cortesía para no saturar hosts
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n🎉 ¡Proceso de descarga y generación de imágenes locales completado exitosamente!');
}

main().catch(console.error);
