// models/Admin_Analytics_Page.js
const mongoose = require('mongoose');

const ClickedAnimalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  clicks: { type: Number, default: 0 }
}, { _id: false });

const AdminAnalyticsPageSchema = new mongoose.Schema({
  totalViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  mostClicked: { type: [ClickedAnimalSchema], default: [] },
  monthlyViews: {
    // example: { Jan: 100, Feb: 200, ... }
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin_Analytics_Page', AdminAnalyticsPageSchema);
