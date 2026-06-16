require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Professional = require('../models/Professional');
const Category = require('../models/Category');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';

async function migrate() {
  try {
    console.log('Migrando al nuevo esquema de categorias marketplace...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Step 1: Assign primaryCategory based on existing category mapping
    const comercioSubSlugs = [
      'com-farmacia', 'com-optica', 'com-kiosco', 'com-rotiseria', 'com-tienda',
      'com-perfumeria', 'com-almacen', 'com-panaderia', 'com-carniceria', 'com-verduleria',
      'com-heladeria', 'com-libreria', 'com-jugueteria', 'com-ferreteria', 'com-bazar',
      'com-muebleria', 'com-electro', 'com-alimentos-mayorista', 'com-bebidas-mayorista',
      'com-distribuidora', 'com-limpieza-industrial', 'com-mixto-almacen', 'com-mixto-tienda',
      'com-mixto-dual', 'almacen', 'supermercado', 'dietetica', 'carniceria', 'panaderia',
      'verduleria', 'vineria', 'heladeria', 'libreria', 'indumentaria', 'regalos',
      'ferreteria', 'electrodomesticos', 'farmacia', 'perfumeria', 'jugueteria',
      'tienda-mascotas', 'casa-repuestos', 'muebleria', 'bazar', 'productos-regionales',
      'cerrajeria-comercial'
    ];

    const seguridadSlugs = ['vigilancia-privada', 'alarmas-monitoreo', 'seguridad-electronica', 'seguridad-personal', 'proteccion-incendios'];

    // Step 2: Assign primaryCategory for all professionals
    const allPros = await Professional.find({});
    let updated = 0;
    let migratedFromSeguridad = 0;

    for (const pro of allPros) {
      let needsSave = false;

      if (!pro.primaryCategory) {
        const catIds = (pro.categories || []).map(c => c.categoryId?.toString()).filter(Boolean);
        const cats = await Category.find({ _id: { $in: catIds } }).lean() || [];
        const proSlugs = cats.map(c => c.slug);

        // Check if any commerce subcategory
        const hasCommerceCat = proSlugs.some(s => comercioSubSlugs.includes(s));
        const hasSeguridadCat = proSlugs.some(s => seguridadSlugs.includes(s));

        if (hasCommerceCat) {
          pro.primaryCategory = 'comercio';
          pro.commerceType = 'minorista';
          // Find the first commerce slug to derive subCategory
          const commerceSlug = proSlugs.find(s => comercioSubSlugs.includes(s));
          if (commerceSlug) {
            const parts = commerceSlug.split('-');
            pro.subCategory = parts.slice(1).join(' ').replace(/\b\w/g, c => c.toUpperCase());
          } else {
            pro.subCategory = 'Tienda';
          }
          needsSave = true;
        } else if (hasSeguridadCat) {
          pro.primaryCategory = 'comercio';
          pro.commerceType = 'minorista';
          pro.subCategory = 'Tienda';
          pro.tags = pro.tags || [];
          if (!pro.tags.includes('24hs')) pro.tags.push('24hs');
          migratedFromSeguridad++;
          needsSave = true;
        }
      }

      if (!pro.primaryCategory) {
        // Default: professionals category
        pro.primaryCategory = 'professional';
        needsSave = true;
      }

      if (needsSave) {
        await pro.save();
        updated++;
      }
    }

    console.log(`\nMigracion completada:`);
    console.log(`  - Total profesionales procesados: ${allPros.length}`);
    console.log(`  - Actualizados con primaryCategory: ${updated}`);
    console.log(`  - Migrados de Seguridad a Comercio: ${migratedFromSeguridad}`);

    // Step 3: Flag old Seguridad/Delivery categories as inactive
    const slugsToDeprecate = ['seguridad', 'delivery'];
    for (const slug of slugsToDeprecate) {
      const cat = await Category.findOne({ slug });
      if (cat && cat.isActive) {
        cat.isActive = false;
        await cat.save();
        console.log(`  - Categoria "${slug}" marcada como inactiva`);
      }
    }

    const comercioCat = await Category.findOne({ slug: 'comercio' });
    if (comercioCat) {
      console.log(`\nCategoria Comercio lista:`);
      console.log(`  - ID: ${comercioCat._id}`);
      console.log(`  - Tipos de comercio: ${(comercioCat.commerceTypes || []).join(', ')}`);
      console.log(`  - Tags disponibles: ${(comercioCat.commerceTags || []).join(', ')}`);
    }

    console.log('\nMigracion completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error en migracion:', error.message);
    logger.error('Migration marketplace error:', error);
    process.exit(1);
  }
}

migrate();
