// models/AdminUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AdminUserSchema = new mongoose.Schema(
  {
    // Name fields
    firstName: { type: String, trim: true, required: true },
    lastName:  { type: String, trim: true, required: true },

    // Phone field
    phone: {
      type: String,
      trim: true,
      required: true,
    },

    // Email & auth
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Email verification support
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, index: true },
    emailVerifyTokenExpiresAt: { type: Date },

    // Optional reset support
    resetToken: String,
    resetTokenExpiresAt: Date,
  },
  { timestamps: true }
);

// Hash password if changed
AdminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare provided password to hash
AdminUserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);
