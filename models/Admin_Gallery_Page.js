// models/Admin_Gallery_Page.js
const mongoose = require('mongoose');

const AdminGalleryPageSchema = new mongoose.Schema(
  {
    heroUrl: { type: String, default: '' }, // main hero image
    heroTitle: { type: String, default: 'Our Gallery' }, // hero title text
    heroSubtitle: { type: String, default: '' }, // hero subtitle text

    info: {
      title: { type: String, default: 'Gallery' },
      text: { type: String, default: '' },
    },

    images: { type: [String], default: [] }, // grid of gallery images

    footer: {
      title: { type: String, default: '' },
      text: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin_Gallery_Page', AdminGalleryPageSchema);
