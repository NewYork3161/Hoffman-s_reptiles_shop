// models/Admin_Animals_Page.js
const mongoose = require('mongoose');

/* Helper: make a URL-safe slug from a name */
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD')               // strip accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')     // non-alphanumerics -> hyphen
    .replace(/(^-|-$)+/g, '');       // trim hyphens
}

/* --- Subdocument: each animal card --- */
const AnimalItemSchema = new mongoose.Schema(
  {
    name:        { type: String, trim: true, required: true },
    slug:        { type: String, trim: true },     // generated if missing
    image:       { type: String, trim: true, default: '' },
    price:       { type: String, trim: true, default: '' },
    available:   { type: Boolean, default: true },
    description: { type: String, trim: true, default: '' }, // shows on detail page
  },
  { _id: true, timestamps: true }
);

/* --- Page document: hero/welcome/footer + embedded animals --- */
const AdminAnimalsPageSchema = new mongoose.Schema(
  {
    heroUrl:     { type: String, default: '' },
    welcomeText: { type: String, default: '' },
    animals:     { type: [AnimalItemSchema], default: [] }, // ✅ always an array
    footer: {
      title: { type: String, default: '' },
      text:  { type: String, default: '' },
    },
  },
  { timestamps: true }
);

/* --- Ensure each new/missing animal.slug is set and unique within this page --- */
AdminAnimalsPageSchema.pre('save', function (next) {
  try {
    // force animals to always be an array
    if (!Array.isArray(this.animals)) {
      this.animals = [];
    }

    const used = new Set(
      this.animals.map(a => (a.slug || '').trim()).filter(Boolean)
    );

    this.animals.forEach((a, idx) => {
      if ((!a.slug || !a.slug.trim()) && a.name) {
        const base = slugify(a.name) || `animal-${(a._id || idx).toString()}`;
        let candidate = base;
        let i = 2;
        // ensure uniqueness among siblings
        while (used.has(candidate)) candidate = `${base}-${i++}`;
        a.slug = candidate;
        used.add(candidate);
      }
    });

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Admin_Animals_Page', AdminAnimalsPageSchema);
