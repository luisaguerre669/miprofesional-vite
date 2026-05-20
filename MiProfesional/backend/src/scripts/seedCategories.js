require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Professional = require('../models/Professional');
const categoriesData = require('./categoryData');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let totalSubs = 0;
    for (const catData of categoriesData) {
      const { subcategories, ...mainData } = catData;

      let parent = await Category.findOne({ slug: mainData.slug });
      if (parent) {
        console.log(`Category "${mainData.title}" already exists, updating...`);
        parent.set(mainData);
      } else {
        parent = new Category(mainData);
      }
      await parent.save();

      const subIds = [];
      for (const subData of subcategories) {
        let sub = await Category.findOne({ slug: subData.slug });
        if (sub) {
          console.log(`   Subcategory "${subData.title}" already exists, updating...`);
          sub.set({ ...subData, parentCategory: parent._id });
        } else {
          sub = new Category({ ...subData, parentCategory: parent._id });
        }
        await sub.save();
        subIds.push(sub._id);
      }

      parent.subcategories = subIds;
      parent.professionalCount = await Professional.countDocuments({ categoryId: { $in: subIds } });
      await parent.save();
      console.log(`  ${mainData.title} (${mainData.slug}) — ${subIds.length} subcategorias, ${parent.professionalCount} profesionales`);
      totalSubs += subIds.length;
    }

    console.log(`\nSeed completado: ${categoriesData.length} categorias principales, ${totalSubs} subcategorias`);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
