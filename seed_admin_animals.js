// seed_admin_animals.js
// Standalone seeder for Admin_Animals_Page (no app.js changes)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const AdminAnimalsPage = require('./models/Admin_Animals_Page'); // <-- keep this path

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Only create a seed doc if none exists (no destructive deletes)
    const existing = await AdminAnimalsPage.findOne({});
    if (existing) {
      console.log('ℹ️ Seed skipped: Admin_Animals_Page document already exists.');
      process.exit(0);
    }

    const seed = new AdminAnimalsPage({
      heroUrl: '/Images/hero_animal_page.png',
      welcomeText:
        "Welcome to Hoffman's Reptiles! Explore snakes, lizards, turtles, and more — perfect for beginners and seasoned keepers.",
      animals: [
        {
          name: 'Green Iguana',
          image: '/Images/lizards.png', // update to a real upload path if needed
          price: '199.99',
          available: true,
        },
        {
          name: 'Ball Python',
          image: '/Images/snakes.png',
          price: '149.99',
          available: false,
        },
      ],
      footer: {
        title: "Hoffman's Reptiles",
        text:
          "Exotic pet shop with reptiles, feeders, and supplies.\n" +
          "2359 Concord Blvd, Concord, CA 94520\n" +
          "Phone: (925) 671-9106\n" +
          "Hours: Mon–Fri 12–6:30 PM | Sat 10–5 PM | Sun Closed",
      },
    });

    await seed.save();
    console.log('🌱 Seeded one Admin_Animals_Page document.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
})();
