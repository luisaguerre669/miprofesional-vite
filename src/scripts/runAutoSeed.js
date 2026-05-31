const Category = require('../models/Category');
const mongoose = require('mongoose');
const categoriesData = require('./categoryData');

async function runAutoSeed() {
  const Professional = mongoose.model('Professional');
  let totalSubs = 0;

  for (const catData of categoriesData) {
    const { subcategories, ...mainData } = catData;

    // Look up by title first (stable key), then by slug (may have changed)
    let parent = await Category.findOne({ title: mainData.title });
    if (!parent) {
      parent = await Category.findOne({ slug: mainData.slug });
    }
    if (parent) {
      parent.set({ ...mainData, isActive: true });
    } else {
      parent = new Category({ ...mainData, isActive: true });
    }
    await parent.save();

    const subIds = [];
    for (const subData of subcategories) {
      // Find subcategory by title first (stable key), then by slug
      let sub = await Category.findOne({ title: subData.title });
      if (!sub) {
        sub = await Category.findOne({ slug: subData.slug });
      }
      if (sub) {
        sub.set({ ...subData, parentCategory: parent._id, isActive: true });
      } else {
        sub = new Category({ ...subData, parentCategory: parent._id, isActive: true });
      }
      await sub.save();
      subIds.push(sub._id);
    }

    parent.subcategories = subIds;
    parent.professionalCount = await Professional.countDocuments({ categoryId: { $in: subIds } });
    await parent.save();
    totalSubs += subIds.length;
  }

  // Cleanup: deactivate old parent categories whose title is no longer in seed data
  const currentTitles = categoriesData.map(c => c.title);
  const oldParents = await Category.find({
    isActive: true,
    parentCategory: null,
    title: { $nin: currentTitles }
  });
  if (oldParents.length > 0) {
    for (const old of oldParents) {
      old.isActive = false;
      await old.save();
    }
  }

  return { parents: categoriesData.length, subs: totalSubs, removed: oldParents.length };
}

module.exports = runAutoSeed;
