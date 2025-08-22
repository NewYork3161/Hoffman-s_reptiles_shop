// admin-homepage-seeds.js
//
// Seeds the "admin_home_pages" collection with the Home page content
//
// Usage:
//   node admin-homepage-seeds.js
//
// Requires .env with MONGODB_URI

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const AdminHomePage = require('./models/Admin_Home_Page');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI in .env');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');

  // --- Content mirrored from your current Home page ---
  const data = {
    carousel: [
      {
        title: "Welcome to Hoffman's Reptiles",
        subtitle:
          "We have exotic animals from all over the world, including Asian water monitors, Argentine black and white tegus, and snakes such as vipers, pythons, and rattlesnakes.",
        image: "/Images/Green.png"
      },
      {
        title: "Exotic Snakes Collection",
        subtitle:
          "Our exotic snake collection includes pythons, rattlesnakes, and other rare species, carefully curated for reptile enthusiasts.",
        image: "/Images/Red.png"
      },
      {
        title: "Rare Iguanas & More",
        subtitle:
          "We also showcase rare iguanas, tegus, and other reptiles from across the globe, ensuring unique choices for collectors.",
        image: "/Images/Yello.png"
      }
    ],

    info: {
      headline: "LOOKING FOR AN EXOTIC PET?",
      text: "Welcome to Hoffman's Reptiles, your go-to source for exotic animals from all over the world. We specialize in lizards, Asian water monitors, Argentine black & white tegus, and a wide selection of snakes including vipers, pythons, and rattlesnakes. Visit us at 2359 Concord Boulevard, Concord, California, 94520, for expert advice and the best in exotic reptiles."
    },

    split: {
      image: "/Images/Blue.png",
      title: "Lizards, Snakes & Animals of All Sorts",
      text: "We offer an extensive selection of reptiles, feeders, and exotic animals from all over the world. Whether you’re looking for lizards, snakes, or rare species, Hoffman's Reptiles has something for every enthusiast."
    },

    grid: {
      title: "A sample of our animals",
      subtitle: "Changes weekly. Please visit our store to see what is in stock.",
      images: [
        "/Images/1.png",
        "/Images/2.png",
        "/Images/3.png",
        "/Images/4.png",
        "/Images/5.png",
        "/Images/6.png",
        "/Images/7.png",
        "/Images/8.png"
      ]
    },

    footer: {
      title: "Hoffman's Reptile Shop",
      text: "Serving Concord, Walnut Creek, San Francisco, and the Bay Area."
    }
  };

  // Upsert a single document (singleton pattern)
  const existing = await AdminHomePage.findOne({});
  if (existing) {
    existing.carousel = data.carousel;
    existing.info = data.info;
    existing.split = data.split;
    existing.grid = data.grid;
    existing.footer = data.footer;
    await existing.save();
    console.log('✏️  Updated existing Home page document.');
  } else {
    await AdminHomePage.create(data);
    console.log('🌱 Created Home page document.');
  }

  await mongoose.connection.close();
  console.log('🔒 MongoDB connection closed.');
}

run().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
