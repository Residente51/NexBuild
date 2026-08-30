import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas a los archivos
const jsonPath = path.join(__dirname, '../data/hardware.json');
const outputPath = path.join(__dirname, '../data/catalog.ts');

try {
  // 1. Leer el archivo hardware.json
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const db = JSON.parse(rawData);

  const catalog = [];

  // 2 & 3. Transformar CPUs
  if (db.cpus) {
    db.cpus.forEach((cpu) => {
      catalog.push({
        id: cpu.id, // El mismo del JSON (string)
        slug: cpu.name.toLowerCase().replace(/\s+/g, '-'), // Necesario para BaseComponent
        name: cpu.name,
        brand: cpu.brand, // Necesario para BaseComponent en la raíz
        category: 'cpu',
        price: cpu.price,
        image: '/images/placeholder.png',
        specs: {
          socket: cpu.socket,
          // Agregamos las propiedades obligatorias de CPUComponent para cumplir la interfaz
          tdp: cpu.powerDrawW,
          hasIntegratedGraphics: false,
          includesCooler: false,
        },
      });
    });
  }

  // 2 & 3. Transformar Motherboards
  if (db.motherboards) {
    db.motherboards.forEach((mb) => {
      // Inferencia básica del tipo de RAM para que la compatibilidad funcione
      const ramType = mb.socket === 'AM5' ? 'ddr5' : 'ddr4';

      catalog.push({
        id: mb.id, // El mismo del JSON (string)
        slug: mb.name.toLowerCase().replace(/\s+/g, '-'), // Necesario para BaseComponent
        name: mb.name,
        brand: mb.brand, // Necesario para BaseComponent en la raíz
        category: 'motherboard',
        price: mb.price,
        image: '/images/placeholder.png',
        specs: {
          socket: mb.socket,
          formFactor: mb.formFactor,
          // Agregamos las propiedades obligatorias de MotherboardComponent
          ramType: ramType,
          ramSlots: 4,
          m2Slots: 2,
          sataPorts: 4,
        },
      });
    });
  }

  // Transformar GPUs
  if (db.gpus) {
    db.gpus.forEach((gpu) => {
      catalog.push({
        id: gpu.id,
        slug: gpu.name.toLowerCase().replace(/\s+/g, '-'),
        name: gpu.name,
        brand: gpu.brand,
        category: 'gpu',
        price: gpu.price,
        image: '/images/placeholder.png',
        specs: {
          length: 300, // Valor referencial
          slotWidth: 2, // Valor referencial
          recommendedPsuWattage: gpu.powerDrawW + 250, // Estimación segura
        },
      });
    });
  }

  // Transformar RAM
  if (db.ram) {
    db.ram.forEach((ram) => {
      // Extraer modules y capacityPerModule de "16GB (2x8GB)"
      const match = ram.capacity.match(/(\d+)x(\d+)GB/i);
      const modules = match ? parseInt(match[1], 10) : 2;
      const capacityPerModule = match ? parseInt(match[2], 10) : 8;

      catalog.push({
        id: ram.id,
        slug: ram.name.toLowerCase().replace(/\s+/g, '-'),
        name: ram.name,
        brand: ram.brand,
        category: 'ram',
        price: ram.price,
        image: '/images/placeholder.png',
        specs: {
          ramType: ram.type === 'ddr5' ? 'ddr5' : 'ddr4',
          modules: modules,
          capacityPerModule: capacityPerModule,
        },
      });
    });
  }

  // Transformar PSUs
  if (db.psus) {
    db.psus.forEach((psu) => {
      catalog.push({
        id: psu.id,
        slug: psu.name.toLowerCase().replace(/\s+/g, '-'),
        name: psu.name,
        brand: psu.brand,
        category: 'psu',
        price: psu.price,
        image: '/images/placeholder.png',
        specs: {
          wattage: psu.wattage,
          formFactor: 'atx', // Por defecto asumimos ATX
        },
      });
    });
  }

  // Transformar Storage
  if (db.storage) {
    db.storage.forEach((disk) => {
      const isNvme = disk.type.toLowerCase() === 'nvme';
      // Convertir "1TB" a 1000, "500GB" a 500
      let capacityNum = parseInt(disk.capacity, 10);
      if (disk.capacity.toLowerCase().includes('tb')) {
        capacityNum *= 1000;
      }

      catalog.push({
        id: disk.id,
        slug: disk.name.toLowerCase().replace(/\s+/g, '-'),
        name: disk.name,
        brand: disk.brand,
        category: 'storage',
        price: disk.price,
        image: '/images/placeholder.png',
        specs: {
          type: isNvme ? 'nvme' : 'sata',
          formFactor: isNvme ? 'm.2 2280' : '2.5', // Asumimos M.2 para NVMe y 2.5" para el resto
          capacity: capacityNum,
        },
      });
    });
  }


  // 4. Generar string con código TypeScript
  // Usamos 'as PCComponent[]' para saltar la validación estricta al inyectar campos mapeados del JSON.
  const tsContent = `import type { PCComponent } from "@/types/component";

export const mockCatalog: PCComponent[] = ${JSON.stringify(catalog, null, 2)} as PCComponent[];
`;

  // 5. Escribir el archivo en data/catalog.ts
  fs.writeFileSync(outputPath, tsContent, 'utf8');

  // 6. Imprimir éxito
  console.log('✅ Catálogo generado exitosamente en apps/web/data/catalog.ts');
} catch (error) {
  console.error('❌ Error al generar el catálogo:', error);
}
