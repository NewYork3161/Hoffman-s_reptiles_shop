// models/Admin_About_Page.js
const mongoose = require('mongoose');

const AdminAboutPageSchema = new mongoose.Schema({
  hero: {
    image: { type: String, default: '' },
    title: { type: String, default: 'About Us' },
    subtitle: { type: String, default: 'Learn more about Hoffman’s Reptile Shop' }
  },
  content: {
    text: { type: String, default: '' }
  },
  footer: {
    title: { type: String, default: 'Hoffman’s Reptiles' },
    text: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AdminAboutPageSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Admin_About_Page', AdminAboutPageSchema);
