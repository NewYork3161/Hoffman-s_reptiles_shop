const mongoose = require('mongoose');

/* ========== CAROUSEL ========== */
const CarouselSchema = new mongoose.Schema({
  image: { type: String, required: true }, // Image path/URL
  title: { type: String, default: null },
  description: { type: String, default: null }  // ✅ was subtitle
});

/* ========== GRID ========== */
const GridSchema = new mongoose.Schema({
  title: { type: String, default: null },    
  subtitle: { type: String, default: null }, 
  images: [{ type: String }]
});

/* ========== MAIN PAGE SCHEMA ========== */
const AdminHomePageSchema = new mongoose.Schema({
  carousel: [CarouselSchema],

  info: {   // Headline + paragraph under carousel
    headline: { type: String, default: null },
    text: { type: String, default: null }
  },

  split: {  // Image + text section
    image: { type: String, default: null },
    title: { type: String, default: null },
    text: { type: String, default: null }
  },

  mid: {    // ✅ New Mid Section (single text block)
    text: { type: String, default: null }
  },

  grid: GridSchema, // Title + subtitle + images

  footer: {  // Footer content
    title: { type: String, default: null },
    text: { type: String, default: null }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/* ========== TIMESTAMP HOOK ========== */
AdminHomePageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Admin_Home_Page', AdminHomePageSchema);
