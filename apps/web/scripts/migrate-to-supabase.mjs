import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

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
  const stores = ['spdigital', 'pcfactory'];
  const storeIdMap = {};

  for (const storeSlug of stores) {
    const storeName = storeSlug === 'spdigital' ? 'SP Digital' : 'PC Factory';
    
    // Buscar la tienda por nombre en lugar de slug
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('name', storeName)
      .maybeSingle();

    let storeId;

    if (existingStore) {
      storeId = existingStore.id;
    } else {
      // Insertar si no existe
      const { data: newStore, error: insertError } = await supabase
        .from('stores')
        .insert({
          name: storeName,
          website_url: storeSlug === 'spdigital' ? 'https://www.spdigital.cl' : 'https://www.pcfactory.cl'
        })
        .select('id')
        .single();
        
      if (insertError) {
        console.error(`⚠️ Error al insertar tienda ${storeSlug}:`, insertError.message);
      } else if (newStore) {
        storeId = newStore.id;
      }
    }
    
    if (storeId) {
      storeIdMap[storeSlug] = storeId;
    }
  }

  // 3. Procesar cada categoría
  const categoryMap = [
    { key: 'cpus', domain: 'cpu' },
    { key: 'motherboards', domain: 'motherboard' },
    { key: 'gpus', domain: 'gpu' },
    { key: 'ram', domain: 'ram' },
    { key: 'psus', domain: 'psu' },
    { key: 'storage', domain: 'storage' }
  ];

  for (const { key, domain } of categoryMap) {
    if (!db[key]) continue;

    for (const item of db[key]) {
      const slug = item.name.toLowerCase().replace(/\s+/g, '-');
      let specs = {};

      if (domain === 'cpu') {
        specs = {
          socket: item.socket,
          tdp: item.powerDrawW,
          hasIntegratedGraphics: false,
          includesCooler: false,
        };
      } else if (domain === 'motherboard') {
        specs = {
          socket: item.socket,
          formFactor: item.formFactor,
          ramType: item.socket === 'AM5' ? 'ddr5' : 'ddr4',
          ramSlots: 4,
          m2Slots: 2,
          sataPorts: 4,
        };
      } else if (domain === 'gpu') {
        specs = {
          length: 300,
          slotWidth: 2,
          recommendedPsuWattage: (item.powerDrawW || 200) + 250,
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
          formFactor: isNvme ? 'm.2 2280' : '2.5',
          capacity: capacityNum,
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
      const storeSlug = item.name.length % 2 === 0 ? 'spdigital' : 'pcfactory';
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
              product_url: `https://www.${storeSlug}.cl/producto/${slug}`,
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
              product_url: `https://www.${storeSlug}.cl/producto/${slug}`,
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
