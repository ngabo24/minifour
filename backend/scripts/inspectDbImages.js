const mongoose = require('mongoose');
require('../config/env').loadEnv();
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '../../frontend/src/assets');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'minifour' });
  const docs = await Product.find().sort({ category: 1, name: 1 });
  const images = [...new Set(docs.map((d) => d.image))].sort();
  console.log('TOTAL PRODUCTS:', docs.length);
  console.log('UNIQUE IMAGES:', images.length);
  images.forEach((img) => {
    const p = path.join(ASSETS, img);
    console.log(fs.existsSync(p) ? 'OK   ' : 'MISS ', img);
  });
  console.log('--- CATEGORIES ---');
  const cats = {};
  docs.forEach((d) => { cats[d.category] = (cats[d.category] || 0) + 1; });
  console.log(cats);
  console.log('--- FULL LIST ---');
  docs.forEach((d) => console.log([d.category, d.name, d.price, d.stock, d.image, d.featured].join(' | ')));
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
