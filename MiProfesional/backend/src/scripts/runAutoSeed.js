const Category = require('../models/Category');
const mongoose = require('mongoose');
const categoriesData = require('./categoryData');

async function runAutoSeed() {
  const Professional = mongoose.model('Professional');
  let totalSubs = 0;

  for (const catData of categoriesData) {
    const { subcategories, ...mainData } = catData;

    let parent = await Category.findOne({ slug: mainData.slug });
    if (parent) {
      parent.set(mainData);
    } else {
      parent = new Category(mainData);
    }
    await parent.save();

    const subIds = [];
    for (const subData of subcategories) {
      let sub = await Category.findOne({ slug: subData.slug });
      if (sub) {
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
    totalSubs += subIds.length;
  }

  return { parents: categoriesData.length, subs: totalSubs };
}

module.exports = runAutoSeed;
