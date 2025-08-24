// seed_admin_gallery.js
require('dotenv').config();
const mongoose = require('mongoose');
const AdminGalleryPage = require('./models/Admin_Gallery_Page');

const MONGODB_URI = process.env.MONGODB_URI;

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    const existing = await AdminGalleryPage.findOne({});
    if (existing) {
      console.log('ℹ️ Gallery seed skipped (already exists)');
      process.exit(0);
    }

    await AdminGalleryPage.create({
      hero: {
        image: '/Images/hero_gallery.png',
        title: 'Our Gallery',
        subtitle: 'Explore Our Exotic Animals'
      },
      info: {
        title: 'Photo Gallery',
        text: 'See our reptiles, shop life, and events.'
      },
      images: [
        '/Images/gallery_placeholder.png',
        '/Images/gallery_placeholder2.png'
      ],
      footer: {
        title: 'Hoffman’s Reptiles',
        text: '2359 Concord Blvd, Concord, CA 94520'
      }
    });

    console.log('🌱 Gallery seed created with new schema');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
})();
