// admin_animals_routes_page.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const AdminAnimalsPage = require('./models/Admin_Animals_Page');

/* ---------- Multer upload to /public/uploads ---------- */
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ---------- Helpers ---------- */
async function getOrCreatePage() {
  let doc = await AdminAnimalsPage.findOne({});
  if (!doc) {
    doc = new AdminAnimalsPage({});
    await doc.save();
  }
  return doc;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* ---------- EDIT SCREEN ---------- */
// GET /admin/edit/animals
router.get('/edit/animals', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    res.render('admin_animals_edit', {
      title: 'Edit Animals - Admin',
      heroUrl: page.heroUrl,
      welcomeText: page.welcomeText,
      animals: page.animals,
      footer: page.footer,
      msg: req.query.msg || null,
    });
  } catch (err) {
    console.error('❌ Load animals editor error:', err);
    res.status(500).send('Error loading Animals editor');
  }
});

/* ---------- HERO ---------- */
// PUT /admin/animals/hero
router.put('/animals/hero', upload.single('imageFile'), async (req, res) => {
  try {
    const page = await getOrCreatePage();
    if (req.file) {
      page.heroUrl = '/uploads/' + req.file.filename;
      await page.save();
    }
    res.redirect('/admin/edit/animals?msg=Hero updated#section-hero');
  } catch (err) {
    console.error('❌ Hero update error:', err);
    res.status(500).send('Error updating hero image');
  }
});

/* ---------- WELCOME TEXT ---------- */
// PUT /admin/animals/welcome
router.put('/animals/welcome', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    page.welcomeText = (req.body.text || '').trim();
    await page.save();
    res.redirect('/admin/edit/animals?msg=Welcome text saved#section-welcome');
  } catch (err) {
    console.error('❌ Welcome update error:', err);
    res.status(500).send('Error saving welcome text');
  }
});

/* ---------- GRID: ADD ITEM ---------- */
// POST /admin/animals/items
router.post('/animals/items', upload.single('imageFile'), async (req, res) => {
  try {
    const page = await getOrCreatePage();
    const { name, price, available } = req.body;

    page.animals.push({
      name: (name || '').trim(),
      price: (price || '').trim(),
      available: String(available) === 'true',
      image: req.file ? '/uploads/' + req.file.filename : '',
    });

    await page.save();
    res.redirect('/admin/edit/animals?msg=Animal added#section-grid');
  } catch (err) {
    console.error('❌ Add animal error:', err);
    res.status(500).send('Error adding animal');
  }
});

/* ---------- GRID: UPDATE ITEM (text OR image) ---------- */
// PUT /admin/animals/items/:id
router.put('/animals/items/:id', upload.single('imageFile'), async (req, res) => {
  try {
    const page = await getOrCreatePage();
    const { id } = req.params;

    // Find by ObjectId if valid, else allow numeric index fallback
    let item = null;
    if (isValidObjectId(id)) {
      item = page.animals.id(id);
    } else {
      const idx = parseInt(id, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < page.animals.length) {
        item = page.animals[idx];
      }
    }
    if (!item) return res.status(404).send('Animal not found');

    if (req.body.__edit === 'imageOnly') {
      if (req.file) item.image = '/uploads/' + req.file.filename;
    } else {
      if (typeof req.body.name !== 'undefined') item.name = (req.body.name || '').trim();
      if (typeof req.body.price !== 'undefined') item.price = (req.body.price || '').trim();
      if (typeof req.body.available !== 'undefined')
        item.available = String(req.body.available) === 'true';
    }

    await page.save();
    res.redirect('/admin/edit/animals?msg=Animal updated#section-grid');
  } catch (err) {
    console.error('❌ Update animal error:', err);
    res.status(500).send('Error updating animal');
  }
});

/* ---------- GRID: DELETE ITEM ---------- */
// DELETE /admin/animals/items/:id
router.delete('/animals/items/:id', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    const { id } = req.params;

    let removed = false;
    if (isValidObjectId(id)) {
      const item = page.animals.id(id);
      if (item) {
        item.deleteOne();
        removed = true;
      }
    } else {
      const idx = parseInt(id, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < page.animals.length) {
        page.animals.splice(idx, 1);
        removed = true;
      }
    }

    if (removed) await page.save();
    res.redirect('/admin/edit/animals?msg=Animal deleted#section-grid');
  } catch (err) {
    console.error('❌ Delete animal error:', err);
    res.status(500).send('Error deleting animal');
  }
});

/* ---------- FOOTER ---------- */
// PUT /admin/animals/footer
router.put('/animals/footer', async (req, res) => {
  try {
    const page = await getOrCreatePage();
    page.footer = {
      title: (req.body.title || '').trim(),
      text: (req.body.text || '').trim(),
    };
    await page.save();
    res.redirect('/admin/edit/animals?msg=Footer saved#section-footer');
  } catch (err) {
    console.error('❌ Footer update error:', err);
    res.status(500).send('Error saving footer');
  }
});

module.exports = router;
