// Seed Script — Categoría COMERCIO + 30 Subcategorías + Reubicación de Seguridad
// Ejecutar con: node src/scripts/seed-comercio.js

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const COMERCIO_SUBCATEGORIES = [
  {
    title: 'Pizzerías',
    slug: 'pizzerias',
    description: 'Pizzerías y rotiserías de pizza al corte y a la piedra',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    icon: 'UtensilsCrossed',
    metadata: { color: '#ef4444' },
    sortOrder: 1,
  },
  {
    title: 'Rotiserías',
    slug: 'rotiserias',
    description: 'Rotiserías con comida caliente y al paso',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
    icon: 'UtensilsCrossed',
    metadata: { color: '#f97316' },
    sortOrder: 2,
  },
  {
    title: 'Hamburgueserías',
    slug: 'hamburgueseserias',
    description: 'Locales de hamburguesas artesanales y gourmet',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    icon: 'UtensilsCrossed',
    metadata: { color: '#d97706' },
    sortOrder: 3,
  },
  {
    title: 'Casas de comida',
    slug: 'casas-de-comida',
    description: 'Comedores, casas de comidas y restaurantes de barrio',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    icon: 'ChefHat',
    metadata: { color: '#ca8a04' },
    sortOrder: 4,
  },
  {
    title: 'Panaderías',
    slug: 'panaderias',
    description: 'Panaderías y pastelerías artesanales',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    icon: 'UtensilsCrossed',
    metadata: { color: '#b45309' },
    sortOrder: 5,
  },
  {
    title: 'Confiterías',
    slug: 'confiterias',
    description: 'Confiterías, pastelerías y repostería',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
    icon: 'UtensilsCrossed',
    metadata: { color: '#92400e' },
    sortOrder: 6,
  },
  {
    title: 'Cafeterías',
    slug: 'cafeterias',
    description: 'Cafeterías, bares y cafés de especialidad',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    icon: 'Coffee',
    metadata: { color: '#78350f' },
    sortOrder: 7,
  },
  {
    title: 'Heladerías',
    slug: 'heladerias',
    description: 'Heladerías artesanales y cremería',
    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80',
    icon: 'IceCream',
    metadata: { color: '#3b82f6' },
    sortOrder: 8,
  },
  {
    title: 'Maxi Kioscos',
    slug: 'maxi-kioscos',
    description: 'Maxi kioscos con amplia variedad de productos',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9667d9f?w=800&q=80',
    icon: 'ShoppingCart',
    metadata: { color: '#7c3aed' },
    sortOrder: 9,
  },
  {
    title: 'Kioscos',
    slug: 'kioscos',
    description: 'Kioscos y pequeños negocios de cercanía',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9667d9f?w=800&q=80',
    icon: 'ShoppingCart',
    metadata: { color: '#6d28d9' },
    sortOrder: 10,
  },
  {
    title: 'Farmacias',
    slug: 'farmacias',
    description: 'Farmacias y droguerías',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80',
    icon: 'Pill',
    metadata: { color: '#059669' },
    sortOrder: 11,
  },
  {
    title: 'Ópticas',
    slug: 'opticas',
    description: 'Ópticas y centros de salud visual',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    icon: 'Glasses',
    metadata: { color: '#0284c7' },
    sortOrder: 12,
  },
  {
    title: 'Veterinarias',
    slug: 'veterinarias',
    description: 'Clínicas veterinarias y petshops',
    image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800&q=80',
    icon: 'PawPrint',
    metadata: { color: '#0891b2' },
    sortOrder: 13,
  },
  {
    title: 'Florerías',
    slug: 'florerias',
    description: 'Florerías y arreglos florales',
    image: 'https://images.unsplash.com/photo-1487530811015-780f1bed0d09?w=800&q=80',
    icon: 'Flower2',
    metadata: { color: '#db2777' },
    sortOrder: 14,
  },
  {
    title: 'Librerías',
    slug: 'librerias',
    description: 'Librerías y artículos de librería y papelería',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    icon: 'BookOpen',
    metadata: { color: '#9333ea' },
    sortOrder: 15,
  },
  {
    title: 'Ferreterías',
    slug: 'ferreterias',
    description: 'Ferreterías y herramientas',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    icon: 'Wrench',
    metadata: { color: '#b45309' },
    sortOrder: 16,
  },
  {
    title: 'Casas de electricidad',
    slug: 'casas-de-electricidad',
    description: 'Materiales eléctricos e instalaciones',
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&q=80',
    icon: 'Zap',
    metadata: { color: '#eab308' },
    sortOrder: 17,
  },
  {
    title: 'Pinturerías',
    slug: 'pinturerías',
    description: 'Pinturerías y productos para la construcción',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80',
    icon: 'Paintbrush',
    metadata: { color: '#2563eb' },
    sortOrder: 18,
  },
  {
    title: 'Corralones',
    slug: 'corralones',
    description: 'Corralones y materiales de construcción',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    icon: 'Building2',
    metadata: { color: '#92400e' },
    sortOrder: 19,
  },
  {
    title: 'Casas de repuestos',
    slug: 'casas-de-repuestos',
    description: 'Repuestos para autos y motos',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    icon: 'Wrench',
    metadata: { color: '#374151' },
    sortOrder: 20,
  },
  {
    title: 'Bicicletería',
    slug: 'bicicleterias',
    description: 'Bicicleterías y tiendas de movilidad urbana',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    icon: 'Bike',
    metadata: { color: '#16a34a' },
    sortOrder: 21,
  },
  {
    title: 'Locales de informática',
    slug: 'locales-de-informatica',
    description: 'Tiendas de computadoras y equipos informáticos',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    icon: 'Monitor',
    metadata: { color: '#0f766e' },
    sortOrder: 22,
  },
  {
    title: 'Locales de telefonía',
    slug: 'locales-de-telefonia',
    description: 'Locales de celulares y accesorios de telefonía',
    image: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&q=80',
    icon: 'Smartphone',
    metadata: { color: '#1d4ed8' },
    sortOrder: 23,
  },
  {
    title: 'Tiendas de ropa',
    slug: 'tiendas-de-ropa',
    description: 'Indumentaria y moda',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
    icon: 'Shirt',
    metadata: { color: '#7c3aed' },
    sortOrder: 24,
  },
  {
    title: 'Zapaterías',
    slug: 'zapaterias',
    description: 'Calzado y accesorios de cuero',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    icon: 'ShoppingBag',
    metadata: { color: '#92400e' },
    sortOrder: 25,
  },
  {
    title: 'Jugueterías',
    slug: 'jugueterias',
    description: 'Jugueterías y entretenimiento infantil',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    icon: 'Gift',
    metadata: { color: '#ec4899' },
    sortOrder: 26,
  },
  {
    title: 'Regalerías',
    slug: 'regalerias',
    description: 'Regalos, souvenirs y artículos de decoración',
    image: 'https://images.unsplash.com/photo-1513201099705-a9746072f043?w=800&q=80',
    icon: 'Gift',
    metadata: { color: '#f59e0b' },
    sortOrder: 27,
  },
  {
    title: 'Dietéticas',
    slug: 'dieteticas',
    description: 'Productos naturales, orgánicos y dietéticos',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
    icon: 'Leaf',
    metadata: { color: '#16a34a' },
    sortOrder: 28,
  },
  {
    title: 'Vinotecas',
    slug: 'vinotecas',
    description: 'Vinos, cervezas artesanales y bebidas finas',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    icon: 'Wine',
    metadata: { color: '#7f1d1d' },
    sortOrder: 29,
  },
  {
    title: 'Comercios varios',
    slug: 'comercios-varios',
    description: 'Otros negocios y locales comerciales de barrio',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    icon: 'Store',
    metadata: { color: '#6b7280' },
    sortOrder: 30,
  },
];

async function seed() {
  console.log('🌱 Iniciando seed de categoría COMERCIO...\n');

  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar si COMERCIO ya existe
    const existingComercio = await Category.findOne({ slug: 'comercio' });
    if (existingComercio) {
      console.log('⚠️  La categoría COMERCIO ya existe (slug: comercio). Saltando creación.\n');
    } else {
      // Crear categoría principal COMERCIO
      const comercio = new Category({
        title: 'Comercio',
        slug: 'comercio',
        description: 'Pizzerías, farmacias, veterinarias, ópticas, panaderías y más de 30 categorías de locales comerciales de barrio',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
        icon: 'Store',
        isActive: true,
        sortOrder: 1,
        parentCategory: null,
        metadata: {
          color: '#f59e0b',
          featured: true,
          popular: true,
          emergency: false,
        },
      });
      await comercio.save();
      console.log(`✅ Categoría principal COMERCIO creada: ${comercio._id}\n`);

      // Crear las 30 subcategorías
      console.log('📦 Creando subcategorías...');
      const subcategoryIds = [];
      for (const subData of COMERCIO_SUBCATEGORIES) {
        const existing = await Category.findOne({ slug: subData.slug });
        if (existing) {
          console.log(`  ⚠️  Subcategoría ya existe: ${subData.title} (${subData.slug})`);
          subcategoryIds.push(existing._id);
          // Asignar parent si no lo tiene
          if (!existing.parentCategory) {
            existing.parentCategory = comercio._id;
            await existing.save();
          }
          continue;
        }
        const sub = new Category({
          ...subData,
          parentCategory: comercio._id,
          isActive: true,
          subcategories: [],
        });
        await sub.save();
        subcategoryIds.push(sub._id);
        console.log(`  ✅ ${subData.title}`);
      }

      // Actualizar el array subcategories de COMERCIO
      comercio.subcategories = subcategoryIds;
      await comercio.save();
      console.log(`\n✅ ${subcategoryIds.length} subcategorías vinculadas a COMERCIO\n`);
    }

    // 2. Reubicar Seguridad como subcategoría de Servicios Generales
    console.log('🔄 Buscando categoría Seguridad para reubicar...');
    const seguridad = await Category.findOne({
      $or: [
        { slug: 'seguridad' },
        { title: /seguridad/i },
      ],
      parentCategory: null, // Solo si es categoría raíz
    });

    if (!seguridad) {
      console.log('  ℹ️  No se encontró la categoría Seguridad como categoría raíz. Saltando.\n');
    } else {
      // Buscar Servicios Generales
      const serviciosGenerales = await Category.findOne({
        $or: [
          { slug: 'servicios-generales' },
          { title: /servicios generales/i },
        ],
        parentCategory: null,
      });

      if (!serviciosGenerales) {
        console.log('  ⚠️  No se encontró la categoría Servicios Generales. No se puede reubicar Seguridad.\n');
      } else {
        // Asignar parentCategory a Seguridad
        seguridad.parentCategory = serviciosGenerales._id;
        await seguridad.save();

        // Agregar al array subcategories de Servicios Generales
        if (!serviciosGenerales.subcategories.map(String).includes(String(seguridad._id))) {
          serviciosGenerales.subcategories.push(seguridad._id);
          await serviciosGenerales.save();
        }

        console.log(`  ✅ Seguridad (${seguridad._id}) reubicada como subcategoría de Servicios Generales (${serviciosGenerales._id})\n`);
      }
    }

    console.log('🎉 Seed completado exitosamente!');
    console.log('   - Categoría COMERCIO creada con 30 subcategorías');
    console.log('   - Seguridad reubicada en Servicios Generales');
    console.log('\nPuedes verificar en el Admin Panel o con: GET /api/v1/categories/tree');

  } catch (err) {
    console.error('❌ Error durante el seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Desconectado de MongoDB');
  }
}

seed();
