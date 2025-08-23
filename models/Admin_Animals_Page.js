// models/Admin_Animals_Page.js
const mongoose = require('mongoose');

const AnimalItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    image: { type: String, trim: true },
    price: { type: String, trim: true },
    available: { type: Boolean, default: true },
  },
  { _id: true } // keep _id so we can address items by id
);

const AdminAnimalsPageSchema = new mongoose.Schema(
  {
    heroUrl: { type: String, default: '' },
    welcomeText: { type: String, default: '' },
    animals: { type: [AnimalItemSchema], default: [] },
    footer: {
      title: { type: String, default: '' },
      text: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin_Animals_Page', AdminAnimalsPageSchema);
