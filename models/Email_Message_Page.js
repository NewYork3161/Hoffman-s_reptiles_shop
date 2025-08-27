// models/Email_Message_Page.js
const mongoose = require('mongoose');

const EmailMessagePageSchema = new mongoose.Schema(
  {
    Full_Name: { type: String, required: true },
    Email: { type: String, required: true },
    Message: { type: String, required: true },
  },
  { timestamps: true } // adds CreatedAt + UpdatedAt
);

module.exports = mongoose.model('Email_Message_Page', EmailMessagePageSchema);
