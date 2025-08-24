const mongoose = require('mongoose');

const AdminContactPageSchema = new mongoose.Schema({
  info: {
    title: { type: String, default: "Contact Hoffman's Reptiles" },
    text: { type: String, default: "Tell visitors how to reach you, typical response times, etc." },
  },
  details: {
    address: { type: String, default: "2359 Concord Blvd, Concord, CA 94520" },
    phone: { type: String, default: "(925) 671-9106" },
    email: { type: String, default: "info@hoffmansreptiles.com" },
    hours: { type: String, default: "Mon–Fri: 12 PM – 6:30 PM | Sat: 10 AM – 5 PM | Sun: Closed" },
    mapEmbed: { type: String, default: "" },
  },
  footer: {
    title: { type: String, default: "Hoffman's Reptiles" },
    text: { type: String, default: "Trusted reptile experts in Concord, CA" },
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin_Contact_Page', AdminContactPageSchema);
