/**
 * Cleanup Fake Images Script
 *
 * Lee el directorio public/images/components/ y elimina todos los archivos
 * que tengan extensión .png pero cuyo contenido real sea texto SVG (archivos "falsos").
 * Deja intactos los binarios reales de imágenes.
 *
 * Usage:
 *   node apps/web/scripts/cleanup-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../public/images/components');

function cleanup() {
  console.log("🧹 Iniciando limpieza de imágenes falsas (SVG)...\n");

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ El directorio ${IMAGES_DIR} no existe.`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGES_DIR);
  let deletedCount = 0;
  let keptCount = 0;

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      // Leer los primeros bytes para detectar si es texto o binario
      const buffer = Buffer.alloc(100); // Leer los primeros 100 bytes
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 100, 0);
      fs.closeSync(fd);

      const header = buffer.toString('utf8');

      // Si empieza con <svg o si el archivo fue escrito puramente como string en la pasada anterior
      if (header.includes('<svg') || header.trim().startsWith('<svg')) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️ Eliminado: ${file} (SVG falso)`);
      } else {
        keptCount++;
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Tarea finalizada.`);
  console.log(`🗑️ Archivos eliminados: ${deletedCount}`);
  console.log(`🖼️ Imágenes reales conservadas: ${keptCount}`);
  console.log(`${"=".repeat(50)}\n`);
}

cleanup();
