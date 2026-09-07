import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);
const slugify = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

// 2. Leer hardware.json
const jsonPath = path.join(__dirname, '../data/hardware.json');
let db;
try {
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  db = JSON.parse(rawData);
} catch (error) {
  console.error('❌ Error al leer hardware.json:', error);
  process.exit(1);
}

async function migrate() {
  let productsCount = 0;
  let listingsCount = 0;

  console.log('🚀 Iniciando migración a Supabase...');

  // Asegurar que las tiendas existen
  const stores = [
    {
      slug: 'nexbuild-reference',
      name: 'Precio referencial NexBuild',
      websiteUrl: null,
    },
  ];
  const storeIdMap = {};

  for (const store of stores) {
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', store.slug)
      .maybeSingle();

    let storeId;

    if (existingStore) {
      storeId = existingStore.id;
    } else {
      // Insertar si no existe
      const { data: newStore, error: insertError } = await supabase
        .from('stores')
        .insert({
          slug: store.slug,
          name: store.name,
          website_url: store.websiteUrl,
        })
        .select('id')
        .single();
        
      if (insertError) {
        console.error(`⚠️ Error al insertar fuente ${store.slug}:`, insertError.message);
      } else if (newStore) {
        storeId = newStore.id;
      }
    }
    
    if (storeId) {
      storeIdMap[store.slug] = storeId;
    }
  }

  // 3. Procesar cada categoría
  const categoryMap = [
    { key: 'cpus', domain: 'cpu' },
    { key: 'motherboards', domain: 'motherboard' },
    { key: 'gpus', domain: 'gpu' },
    { key: 'ram', domain: 'ram' },
    { key: 'psus', domain: 'psu' },
    { key: 'storage', domain: 'storage' },
    { key: 'cases', domain: 'case' },
    { key: 'coolers', domain: 'cooler' }
  ];

  for (const { key, domain } of categoryMap) {
    if (!db[key]) continue;

    for (const item of db[key]) {
      const slug = slugify(item.name);
      let specs = {};

      if (domain === 'cpu') {
        specs = {
          socket: item.socket,
          tdp: item.powerDrawW,
          hasIntegratedGraphics: item.hasIntegratedGraphics ?? false,
          includesCooler: item.includesCooler ?? false,
        };
      } else if (domain === 'motherboard') {
        specs = {
          socket: item.socket,
          formFactor: item.formFactor,
          ramType: item.socket === 'AM5'
            ? 'ddr5'
            : /ddr4|\bd4\b/i.test(item.name)
              ? 'ddr4'
              : item.socket === 'AM4'
                ? 'ddr4'
                : 'ddr5',
          ramSlots: item.ramSlots ?? 4,
          m2Slots: item.m2Slots ?? 2,
          sataPorts: item.sataPorts ?? 4,
        };
      } else if (domain === 'gpu') {
        specs = {
          length: item.length,
          slotWidth: item.slotWidth,
          recommendedPsuWattage: item.recommendedPsuWattage,
          powerDraw: item.powerDrawW || 200,
        };
      } else if (domain === 'ram') {
        const match = item.capacity?.match(/(\d+)x(\d+)GB/i);
        const modules = match ? parseInt(match[1], 10) : 2;
        const capacityPerModule = match ? parseInt(match[2], 10) : 8;
        specs = {
          ramType: item.type === 'ddr5' ? 'ddr5' : 'ddr4',
          modules: modules,
          capacityPerModule: capacityPerModule,
        };
      } else if (domain === 'psu') {
        specs = {
          wattage: item.wattage,
          formFactor: 'atx',
        };
      } else if (domain === 'storage') {
        const isNvme = item.type?.toLowerCase() === 'nvme';
        let capacityNum = parseInt(item.capacity, 10);
        if (item.capacity?.toLowerCase().includes('tb')) {
          capacityNum *= 1000;
        }
        specs = {
          type: isNvme ? 'nvme' : 'sata',
          formFactor: isNvme ? 'm.2 2280' : item.type?.toLowerCase() === 'hdd' ? '3.5' : '2.5',
          capacity: capacityNum,
        };
      } else if (domain === 'case') {
        specs = {
          supportedMotherboards: item.supportedMotherboards,
          maxGpuLength: item.maxGpuLength,
          maxGpuSlotWidth: item.maxGpuSlotWidth,
          maxCoolerHeight: item.maxCoolerHeight,
          supportedPsuFormFactors: item.supportedPsuFormFactors,
          radiatorSupport: item.radiatorSupport,
        };
      } else if (domain === 'cooler') {
        specs = {
          type: item.type,
          supportedSockets: item.supportedSockets,
          ...(item.height ? { height: item.height } : {}),
          ...(item.radiatorSize ? { radiatorSize: item.radiatorSize } : {}),
        };
      }

      // Upsert a products (sin image_url)
      const { data: product, error: productError } = await supabase
        .from('products')
        .upsert({
          slug,
          name: item.name,
          brand: item.brand,
          category: domain,
          specs
        }, { onConflict: 'slug' })
        .select('id')
        .single();

      if (productError) {
        console.error(`❌ Error al migrar producto ${item.name}:`, productError.message);
        continue;
      }

      productsCount++;

      // Upsert a store_listings
      const storeSlug = 'nexbuild-reference';
      const storeId = storeIdMap[storeSlug];

      if (storeId && product?.id) {
        const { data: existingListing } = await supabase
          .from('store_listings')
          .select('id')
          .eq('product_id', product.id)
          .eq('store_id', storeId)
          .maybeSingle();

        let listingError;
        
        if (existingListing) {
          const { error } = await supabase
            .from('store_listings')
            .update({
              price_cash: item.price,
              price_normal: item.price,
              product_url: null,
              in_stock: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingListing.id);
          listingError = error;
        } else {
          const { error } = await supabase
            .from('store_listings')
            .insert({
              product_id: product.id,
              store_id: storeId,
              price_cash: item.price,
              price_normal: item.price,
              product_url: null,
              in_stock: true
            });
          listingError = error;
        }

        if (listingError) {
          console.error(`❌ Error al migrar precio de ${item.name}:`, listingError.message);
        } else {
          listingsCount++;
        }
      }
    }
  }

  console.log(`\n✅ Migración completada exitosamente.`);
  console.log(`📦 Productos migrados/actualizados: ${productsCount}`);
  console.log(`🏷️  Listings de tiendas (precios) registrados: ${listingsCount}`);
}

migrate();
