// seeds-admin-analytics.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import schema
const AdminAnalyticsPage = require('./models/Admin_Analytics_Page');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

mongoose.set('strictQuery', true);

(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear old data if any
    await AdminAnalyticsPage.deleteMany({});
    console.log('🗑️ Old analytics data removed');

    // Seed new analytics doc
    const analyticsDoc = new AdminAnalyticsPage({
      totalViews: 0,
      uniqueVisitors: 0,
      viewsOverTime: [
        { date: new Date(), count: 0 }
      ],
      mostClicked: [
        { name: 'Chubby Frog', clicks: 0 },
        { name: 'Asian Water Monitor', clicks: 0 },
        { name: 'Red Iguana', clicks: 0 }
      ]
    });

    await analyticsDoc.save();
    console.log('🌱 Admin Analytics Page seeded successfully');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
})();
