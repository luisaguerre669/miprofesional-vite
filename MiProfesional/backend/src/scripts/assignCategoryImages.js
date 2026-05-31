require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const { resolveMongoSrv } = require('../utils/srvResolver');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/miprofesional';

// All images are local SVGs placed in frontend/public/images/categories
function buildLocalPath(slug) {
  return `/images/categories/${slug}.svg`;
}
async function ensureImages() {
  const uri = MONGODB_URI.startsWith('mongodb+srv://') ? await resolveMongoSrv(MONGODB_URI) : MONGODB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000, tls: true });
  console.log('Connected to MongoDB');

  const categories = await Category.find({});
  let parentUpdated = 0;
  let subUpdated = 0;
  const examples = [];
  for (const cat of categories) {
    const parentImage = buildLocalPath(cat.slug);
    let parentChanged = false;
    if (!cat.image || !cat.image.startsWith('/images/categories/')) {
      cat.image = parentImage;
      parentUpdated++;
      parentChanged = true;
      if (examples.length < 5) examples.push({ type: 'category', title: cat.title, slug: cat.slug, image: cat.image });
      console.log(`Updated image for category ${cat.slug} -> ${parentImage}`);
    }

    if (cat.subcategories && cat.subcategories.length > 0) {
      await cat.populate('subcategories');
      for (const sub of cat.subcategories) {
        const imageUrl = buildLocalPath(sub.slug);
        if (!sub.image || !sub.image.startsWith('/images/categories/')) {
          sub.image = imageUrl;
          await sub.save();
          subUpdated++;
          if (examples.length < 5) examples.push({ type: 'subcategory', title: sub.title, slug: sub.slug, image: sub.image, parentSlug: cat.slug });
          console.log(`  Updated image for subcategory ${sub.slug} -> ${imageUrl}`);
        }
      }
    }

    if (parentChanged) await cat.save();
  }

  console.log(JSON.stringify({ connection: 'ok', parentUpdated, subUpdated, examples }, null, 2));
  await mongoose.disconnect();
}

ensureImages().catch(err => {
  console.error('Error assigning images:', err);
  process.exit(1);
});

// Usage:
// node backend/src/scripts/assignCategoryImages.js
// This will overwrite category.image and subcategory.image for documents that do not already point to source.unsplash.com
