// admin_home_routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdminHomePage = require('./models/Admin_Home_Page');

// === Multer: save to /public/uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* ---------------- helpers ---------------- */

/**
 * Assign only when the field is present and non-empty.
 * If "<key>__clear=1" is present, set the field to null (explicit clear).
 */
function assignIfProvided(target, key, source) {
  if (!target) return;
  if (Object.prototype.hasOwnProperty.call(source, key)) {
    const raw = (source[key] ?? '').toString().trim();
    if (raw === '') {
      if (source[`${key}__clear`] === '1') target[key] = null; // explicit clear
      // else: ignore empty value => do not overwrite existing content
    } else {
      target[key] = raw;
    }
  }
}

/** Ensure nested objects exist so assignments won't throw */
function ensureStructure(doc) {
  if (!doc.info) doc.info = { headline: null, text: null };
  if (!doc.split) doc.split = { image: null, title: null, text: null };
  if (!doc.mid) doc.mid = { text: null };
  if (!doc.grid) doc.grid = { title: null, subtitle: null, images: [] };
  if (!Array.isArray(doc.grid.images)) doc.grid.images = [];
  if (!doc.footer) doc.footer = { title: null, text: null };
}

/* ---------------- HOME PAGE ADMIN ROUTES ---------------- */

// Load editor
router.get('/edit/home', async (req, res) => {
  try {
    const pageData = await AdminHomePage.findOne({}).lean();
    res.render('admin_home_edit', {
      title: 'Edit Home Page',
      pageData: pageData || {},
      msg: req.query.msg || null
    });
  } catch (err) {
    console.error('❌ Error loading admin edit home:', err);
    res.status(500).send('Error loading editor');
  }
});

/* ---------------- CAROUSEL ---------------- */

// Add slide
router.post('/home/carousel', upload.single('imageFile'), async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    const newSlide = {
      image: req.file ? '/uploads/' + req.file.filename : '',
      title: null,
      description: null
    };
    assignIfProvided(newSlide, 'title', req.body);
    // UI still posts "subtitle" -> maps to description
    if (Object.prototype.hasOwnProperty.call(req.body, 'subtitle')) {
      const raw = (req.body.subtitle ?? '').toString().trim();
      if (raw !== '') newSlide.description = raw;
      else if (req.body['subtitle__clear'] === '1') newSlide.description = null;
    }

    doc.carousel.push(newSlide);
    await doc.save();
    res.redirect('/admin/edit/home?msg=Slide%20added#section-carousel');
  } catch (err) {
    console.error('❌ Add slide error:', err);
    res.status(500).send('Error adding slide');
  }
});

// Update slide
router.put('/home/carousel/:index', upload.single('imageFile'), async (req, res) => {
  try {
    const { index } = req.params;
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');

    const slide = doc.carousel[index];
    if (!slide) return res.status(404).send('Slide not found');

    if (req.body.__edit === 'imageOnly' && req.file) {
      slide.image = '/uploads/' + req.file.filename;
    } else if (req.body.__edit === 'textOnly') {
      assignIfProvided(slide, 'title', req.body);

      if (Object.prototype.hasOwnProperty.call(req.body, 'subtitle')) {
        const raw = (req.body.subtitle ?? '').toString().trim();
        if (raw !== '') slide.description = raw;
        else if (req.body['subtitle__clear'] === '1') slide.description = null;
        // else: ignore empty
      }
    }

    await doc.save();
    res.redirect('/admin/edit/home?msg=Slide%20updated#section-carousel');
  } catch (err) {
    console.error('❌ Update slide error:', err);
    res.status(500).send('Error updating slide');
  }
});

// Delete slide
router.delete('/home/carousel/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');

    if (index >= 0 && index < doc.carousel.length) {
      doc.carousel.splice(index, 1);
      await doc.save();
    }
    res.redirect('/admin/edit/home?msg=Slide%20deleted#section-carousel');
  } catch (err) {
    console.error('❌ Delete slide error:', err);
    res.status(500).send('Error deleting slide');
  }
});

/* ---------------- INFO SECTION ---------------- */
router.put('/home/info', async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    assignIfProvided(doc.info, 'headline', req.body);
    assignIfProvided(doc.info, 'text', req.body);

    await doc.save();
    res.redirect('/admin/edit/home?msg=Info%20updated#section-info');
  } catch (err) {
    console.error('❌ Info update error:', err);
    res.status(500).send('Error updating info section');
  }
});

/* ---------------- SPLIT SECTION ---------------- */

// Replace split image
router.put('/home/split/image', upload.single('imageFile'), async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    if (req.file) doc.split.image = '/uploads/' + req.file.filename;
    await doc.save();
    res.redirect('/admin/edit/home?msg=Split%20image%20updated#section-split');
  } catch (err) {
    console.error('❌ Split image error:', err);
    res.status(500).send('Error updating split image');
  }
});

// Update split text
router.put('/home/split/text', async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    assignIfProvided(doc.split, 'title', req.body);
    assignIfProvided(doc.split, 'text', req.body);

    await doc.save();
    res.redirect('/admin/edit/home?msg=Split%20text%20updated#section-split');
  } catch (err) {
    console.error('❌ Split text error:', err);
    res.status(500).send('Error updating split text');
  }
});

/* ---------------- MID SECTION ---------------- */
router.put('/home/mid', async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    assignIfProvided(doc.mid, 'text', req.body);

    await doc.save();
    res.redirect('/admin/edit/home?msg=Mid%20section%20updated#section-mid');
  } catch (err) {
    console.error('❌ Mid section error:', err);
    res.status(500).send('Error updating mid section');
  }
});

/* ---------------- GRID ---------------- */

// Add a new grid image
router.post('/home/grid', upload.single('imageFile'), async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    if (req.file) {
      doc.grid.images.push('/uploads/' + req.file.filename);
      await doc.save();
    }
    res.redirect('/admin/edit/home?msg=Grid%20image%20added#section-grid-images');
  } catch (err) {
    console.error('❌ Grid add error:', err);
    res.status(500).send('Error adding grid image');
  }
});

// Replace an existing grid image
router.put('/home/grid/:index', upload.single('imageFile'), async (req, res) => {
  try {
    const { index } = req.params;
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    if (req.file && index >= 0 && index < doc.grid.images.length) {
      doc.grid.images[index] = '/uploads/' + req.file.filename;
      await doc.save();
    }
    res.redirect('/admin/edit/home?msg=Grid%20image%20updated#section-grid-images');
  } catch (err) {
    console.error('❌ Grid image error:', err);
    res.status(500).send('Error updating grid image');
  }
});

// Delete a grid image
router.delete('/home/grid/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');

    if (doc.grid && Array.isArray(doc.grid.images) && index >= 0 && index < doc.grid.images.length) {
      doc.grid.images.splice(index, 1);
      await doc.save();
    }
    res.redirect('/admin/edit/home?msg=Grid%20image%20deleted#section-grid-images');
  } catch (err) {
    console.error('❌ Grid delete error:', err);
    res.status(500).send('Error deleting grid image');
  }
});

// Update grid header
router.put('/home/grid-header', async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    assignIfProvided(doc.grid, 'title', req.body);
    assignIfProvided(doc.grid, 'subtitle', req.body);

    await doc.save();
    res.redirect('/admin/edit/home?msg=Grid%20header%20updated#section-grid');
  } catch (err) {
    console.error('❌ Grid header error:', err);
    res.status(500).send('Error updating grid header');
  }
});

/* ---------------- FOOTER ---------------- */
router.put('/home/footer', async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    ensureStructure(doc);

    assignIfProvided(doc.footer, 'title', req.body);
    assignIfProvided(doc.footer, 'text', req.body);

    await doc.save();
    res.redirect('/admin/edit/home?msg=Footer%20updated#section-footer');
  } catch (err) {
    console.error('❌ Footer error:', err);
    res.status(500).send('Error updating footer');
  }
});

/* ---------------- PUBLISH ---------------- */
router.post('/home/publish', async (req, res) => {
  try {
    const doc = await AdminHomePage.findOne({});
    if (!doc) return res.status(404).send('Home page doc not found');
    doc.updatedAt = new Date();
    await doc.save();
    res.redirect('/admin/edit/home?msg=Page%20published');
  } catch (err) {
    console.error('❌ Publish error:', err);
    res.status(500).send('Error publishing page');
  }
});

module.exports = router;
