/**
 * Migration Script: Replace "Emergencias/Urgencias" category with "24-7"
 * This script:
 * 1. Finds category with slug "emergencias" and updates it to "24-7"
 * 2. Ensures metadata.emergency flag is set to true
 * 3. Migrates any professionals referencing old category
 * 4. Validates no broken references
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Professional = require('../models/Professional');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';

async function migrate() {
  try {
    console.log('🔄 Iniciando migración: Emergencias → 24-7');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Step 1: Find old category with slug "emergencias"
    const oldCategory = await Category.findOne({ slug: 'emergencias' });
    
    if (!oldCategory) {
      console.log('ℹ️  No se encontró categoría con slug "emergencias". Verificando si "24-7" existe...');
    } else {
      console.log(`Found old category: ${oldCategory.title} (ID: ${oldCategory._id})`);
    }

    // Step 2: Find or create new "24-7" category
    let newCategory = await Category.findOne({ slug: '24-7' });
    
    if (!newCategory) {
      console.log('📝 Creando nueva categoría "24-7"...');
      newCategory = await Category.create({
        title: '24-7',
        slug: '24-7',
        description: 'Profesionales disponibles 24 horas, 7 días a la semana.',
        image: 'https://images.unsplash.com/photo-1587745416684-47953f16fdd1?w=800&q=80',
        icon: 'AlertTriangle',
        metadata: {
          color: '#dc2626',
          featured: true,
          emergency: true
        },
        sortOrder: 3,
        isActive: true
      });
      console.log(`✅ Nueva categoría creada: ${newCategory._id}`);
    } else {
      console.log(`✅ Categoría "24-7" ya existe: ${newCategory._id}`);
      
      // Ensure emergency flag is set
      if (!newCategory.metadata.emergency) {
        console.log('🔧 Actualizando flag emergency en categoría 24-7...');
        newCategory.metadata.emergency = true;
        await newCategory.save();
      }
    }

    // Step 3: Migrate professionals from old category to new one
    if (oldCategory && oldCategory._id.toString() !== newCategory._id.toString()) {
      const professionalsCount = await Professional.countDocuments({ categoryId: oldCategory._id });
      
      if (professionalsCount > 0) {
        console.log(`🔄 Migrando ${professionalsCount} profesionales de categoría antigua a nueva...`);
        const result = await Professional.updateMany(
          { categoryId: oldCategory._id },
          { categoryId: newCategory._id }
        );
        console.log(`✅ ${result.modifiedCount} profesionales migrados`);
      }

      // Step 4: Migrate subcategories
      const subcategoriesCount = await Category.countDocuments({ parentCategory: oldCategory._id });
      if (subcategoriesCount > 0) {
        console.log(`🔄 Migrando ${subcategoriesCount} subcategorías...`);
        const result = await Category.updateMany(
          { parentCategory: oldCategory._id },
          { parentCategory: newCategory._id }
        );
        console.log(`✅ ${result.modifiedCount} subcategorías migradas`);
      }

      // Step 5: Update new category's subcategories list
      const subcats = await Category.find({ parentCategory: newCategory._id });
      newCategory.subcategories = subcats.map(s => s._id);
      await newCategory.save();
      console.log(`✅ Subcategorías de "24-7" actualizadas: ${subcats.length}`);

      // Step 6: Delete old category
      console.log('🗑️  Eliminando categoría antigua...');
      await Category.deleteOne({ _id: oldCategory._id });
      console.log('✅ Categoría antigua eliminada');
    }

    // Step 7: Validation - verify all emergency category professionals are linked
    const emergencyProfessionals = await Professional.find({ categoryId: newCategory._id });
    console.log(`\n✅ Verificación Final:`);
    console.log(`   - Categoría 24-7 ID: ${newCategory._id}`);
    console.log(`   - Profesionales en 24-7: ${emergencyProfessionals.length}`);
    console.log(`   - Flag emergency: ${newCategory.metadata.emergency}`);
    console.log(`   - Descripción: ${newCategory.description}`);

    // Check for any remaining "emergencias" slug references
    const legacyCheck = await Category.findOne({ slug: 'emergencias' });
    if (legacyCheck) {
      console.log('⚠️  ADVERTENCIA: Aún existe categoría con slug "emergencias"');
    } else {
      console.log('✅ No hay referencias a slug "emergencias"');
    }

    console.log('\n✨ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    logger.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
